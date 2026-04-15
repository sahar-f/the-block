-- Replace place_bid so its auction-window validation tracks the same
-- median-anchor normalization the client uses. Synthetic dataset has fixed
-- timestamps; without this, raw auction_start would always be in the past
-- and every bid would be rejected as "Auction has ended".
CREATE OR REPLACE FUNCTION place_bid(
  p_vehicle_id UUID,
  p_amount INTEGER,
  p_bidder_session TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bid_id UUID;
  v_created_at TIMESTAMPTZ;
  v_current_bid INTEGER;
  v_starting_bid INTEGER;
  v_auction_start TIMESTAMPTZ;
  v_offset_ms BIGINT;
BEGIN
  -- Median-anchor offset: same algorithm the client uses in computeNormalizeOffset.
  -- Slides the live window forward in real time so synthetic data stays evergreen.
  SELECT (
    EXTRACT(EPOCH FROM now()) * 1000
    - percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (data->>'auction_start')::timestamptz) * 1000
      )
  )::bigint
  INTO v_offset_ms
  FROM vehicles;

  SELECT
    (data->>'current_bid')::int,
    (data->>'starting_bid')::int,
    (data->>'auction_start')::timestamptz
  INTO v_current_bid, v_starting_bid, v_auction_start
  FROM vehicles
  WHERE id = p_vehicle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle not found';
  END IF;

  -- Apply the offset once; downstream checks compare against now() as before.
  v_auction_start := v_auction_start + (v_offset_ms || ' milliseconds')::interval;

  IF v_auction_start > now() THEN
    RAISE EXCEPTION 'Auction has not started yet';
  END IF;

  IF v_auction_start + interval '4 hours' <= now() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;

  IF v_current_bid IS NOT NULL AND p_amount < v_current_bid + 100 THEN
    RAISE EXCEPTION 'Bid must be at least % (current bid + $100)', v_current_bid + 100;
  END IF;

  IF v_current_bid IS NULL AND p_amount < v_starting_bid THEN
    RAISE EXCEPTION 'Bid must be at least % (starting bid)', v_starting_bid;
  END IF;

  INSERT INTO bids (vehicle_id, amount, bidder_session)
  VALUES (p_vehicle_id, p_amount, p_bidder_session)
  RETURNING id, created_at INTO v_bid_id, v_created_at;

  UPDATE vehicles
  SET data = jsonb_set(
    jsonb_set(data, '{current_bid}', to_jsonb(p_amount)),
    '{bid_count}',
    to_jsonb((data->>'bid_count')::int + 1)
  )
  WHERE id = p_vehicle_id;

  RETURN json_build_object('id', v_bid_id, 'created_at', v_created_at);
END;
$$;

-- Vehicles table: stores full vehicle JSON in a JSONB column
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bids table: records every bid placed
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  bidder_session TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_vehicle_id ON bids(vehicle_id);

-- Enable Row Level Security on both tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Vehicles: anyone can read, no direct writes (managed via RPC)
CREATE POLICY "vehicles_select" ON vehicles
  FOR SELECT TO anon USING (true);

-- Bids: anyone can read, anyone can insert (anonymous bidding)
CREATE POLICY "bids_select" ON bids
  FOR SELECT TO anon USING (true);

CREATE POLICY "bids_insert" ON bids
  FOR INSERT TO anon WITH CHECK (true);

-- RPC function: atomically validate + insert bid + update vehicle JSONB
-- Server-side validation: auction status, minimum bid amount
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
BEGIN
  -- Read current vehicle state
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

  -- Validate auction is live (within 4 hours of start)
  IF v_auction_start > now() THEN
    RAISE EXCEPTION 'Auction has not started yet';
  END IF;

  IF v_auction_start + interval '4 hours' <= now() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;

  -- Validate bid amount meets minimum (MIN_BID_INCREMENT = 100)
  IF v_current_bid IS NOT NULL AND p_amount < v_current_bid + 100 THEN
    RAISE EXCEPTION 'Bid must be at least % (current bid + $100)', v_current_bid + 100;
  END IF;

  IF v_current_bid IS NULL AND p_amount < v_starting_bid THEN
    RAISE EXCEPTION 'Bid must be at least % (starting bid)', v_starting_bid;
  END IF;

  -- Insert the bid record
  INSERT INTO bids (vehicle_id, amount, bidder_session)
  VALUES (p_vehicle_id, p_amount, p_bidder_session)
  RETURNING id, created_at INTO v_bid_id, v_created_at;

  -- Update the vehicle's JSONB data with new bid info
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

-- Enable real-time for vehicles table (bid updates push to clients)
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;

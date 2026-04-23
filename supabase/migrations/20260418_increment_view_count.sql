-- increment_view_count RPC — atomically increments tour view count
CREATE OR REPLACE FUNCTION increment_view_count(tour_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE tours
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = tour_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

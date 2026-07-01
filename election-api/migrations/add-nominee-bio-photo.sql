-- Optional nominee profile fields (description + image)
ALTER TABLE nominees
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_alt TEXT;

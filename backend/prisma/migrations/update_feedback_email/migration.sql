-- Update the default email address in the Feedback model
ALTER TABLE "Feedback" ALTER COLUMN "emailTo" SET DEFAULT 'studentnoteshub@gmail.com';

-- Update existing records to use the new email address
UPDATE "Feedback" SET "emailTo" = 'studentnoteshub@gmail.com' WHERE "emailTo" = 'atulrajput5968@gmail.com'; 
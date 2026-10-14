-- Update security deposit FAQ answer
UPDATE faqs
SET answer = 'A fully refundable security deposit is collected upon check-in.'
WHERE question = 'Is a security deposit required?';

-- The driver room is not held open for every booking, so the FAQ now says it
-- needs to be asked for in advance. Matches the amenity label changed in 00073.

UPDATE faqs
   SET answer = 'Yes. A driver room with an attached bathroom is available separately from the guest accommodation. It can be arranged upon prior request.'
 WHERE question = 'Can the driver stay at the property?';

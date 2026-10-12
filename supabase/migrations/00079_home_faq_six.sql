UPDATE faqs
   SET is_featured = false
 WHERE question IN (
   'How many guests can Villa 19 accommodate?',
   'Is smoking allowed?'
 );

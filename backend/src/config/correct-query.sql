-- CORRECT QUERY TO SEE ALL COLUMNS INCLUDING updated_at
-- Replace your current query with this one:

SELECT 
  `id`, 
  `first_name`, 
  `last_name`, 
  `date_of_birth`, 
  `gender`, 
  `religion`, 
  LEFT(`address`, 256) as address,
  `nationality`, 
  `parent_type`, 
  `parent_name`, 
  `parent_phone`, 
  LEFT(`parent_address`, 256) as parent_address,
  `parent_gender`, 
  `parent_email`, 
  `parent_religion`, 
  `parent_nationality`, 
  `created_at`, 
  `ethnicity`, 
  `parent_ethnicity`,
  `updated_at`  -- <-- THIS WAS MISSING!
FROM `edutrack`.`students` 
LIMIT 1000;

-- OR SIMPLY USE:
SELECT * FROM `edutrack`.`students` LIMIT 1000;

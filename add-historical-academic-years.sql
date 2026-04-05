-- Add Historical Academic Years
-- Run this to add past academic years for recording historical dues

-- Insert academic years from 2014-15 to 2026-27
-- Adjust the range as needed for your school

INSERT INTO academic_years (year_label, start_date, end_date, is_current)
VALUES
    -- Historical years (past)
    ('2014-15', '2014-06-01', '2015-05-31', false),
    ('2015-16', '2015-06-01', '2016-05-31', false),
    ('2016-17', '2016-06-01', '2017-05-31', false),
    ('2017-18', '2017-06-01', '2018-05-31', false),
    ('2018-19', '2018-06-01', '2019-05-31', false),
    ('2019-20', '2019-06-01', '2020-05-31', false),
    ('2020-21', '2020-06-01', '2021-05-31', false),
    ('2021-22', '2021-06-01', '2022-05-31', false),
    ('2022-23', '2022-06-01', '2023-05-31', false),
    ('2023-24', '2023-06-01', '2024-05-31', false),
    -- Current year should already exist
    -- ('2024-25', '2024-06-01', '2025-05-31', true),
    -- Future years
    ('2025-26', '2025-06-01', '2026-05-31', false),
    ('2026-27', '2026-06-01', '2027-05-31', false)
ON CONFLICT (year_label) DO NOTHING;

-- Verify the years were added
SELECT 
    year_label,
    start_date,
    end_date,
    is_current,
    created_at
FROM academic_years
ORDER BY start_date DESC;

-- Count total academic years
SELECT COUNT(*) as total_academic_years FROM academic_years;

-- Generated solely from committed data/activities.ts by scripts/activity-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicts abort without updates/deletes.
begin;
lock table public.activities in exclusive mode;
lock table public.activity_categories in share mode;
create temporary table phase3c_expected on commit drop as
select * from jsonb_to_recordset($activity_seed$[
  {
    "id": 1,
    "year": "2026",
    "title": "Polymer Composites for Textile Applications: A Review of Materials, Processing and Performance",
    "activity_type": "Conference",
    "institution": "The Institution of Engineers (India), Madurai Local Centre",
    "date_text": "07–08 August 2026",
    "duration_text": null,
    "details": "39th National Convention of Textile Engineers and National Seminar. Technical paper presented.",
    "proof_url": null,
    "source_order": 1,
    "display_order": 1
  },
  {
    "id": 2,
    "year": "2026",
    "title": "AI-Driven Multi-Objective Optimization of Hybrid PA66 Composites Using ML and MPA",
    "activity_type": "Conference",
    "institution": "Anil Neerukonda Institute of Technology and Sciences (ANITS)",
    "date_text": "03–04 July 2026",
    "duration_text": null,
    "details": "ICANITS 2026. Technical paper presented. Received the Best Paper Award.",
    "proof_url": "https://drive.google.com/file/d/1TzMj1rdlHN1mUZZqJ7dZEY4Jw9wt0aTT/view?usp=drive_link",
    "source_order": 2,
    "display_order": 2
  },
  {
    "id": 3,
    "year": "2026",
    "title": "Recent Advances in Additive Manufacturing, AI and Robotic Systems",
    "activity_type": "FDP",
    "institution": "Department of Mechanical Engineering, ANITS, Visakhapatnam",
    "date_text": "15–18 June 2026",
    "duration_text": "4 days",
    "details": null,
    "proof_url": null,
    "source_order": 3,
    "display_order": 3
  },
  {
    "id": 4,
    "year": "2026",
    "title": "AI-Enabled Pedagogy and Outcome Based Education",
    "activity_type": "FDP",
    "institution": "ANITS, Visakhapatnam",
    "date_text": "08–13 June 2026",
    "duration_text": "6 days",
    "details": null,
    "proof_url": null,
    "source_order": 4,
    "display_order": 4
  },
  {
    "id": 5,
    "year": "2025",
    "title": "Fusion CAD and Generative Design",
    "activity_type": "FDP",
    "institution": "ANITS, Visakhapatnam",
    "date_text": "21–25 April 2025",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 5,
    "display_order": 1
  },
  {
    "id": 6,
    "year": "2025",
    "title": "1st International Conference on Material, Design Innovations, and Energy Systems Optimization for Industrial Applications (ICMDESO-2025)",
    "activity_type": "Organizing",
    "institution": "ANITS, Visakhapatnam",
    "date_text": "28–29 March 2025",
    "duration_text": null,
    "details": "Served as an Organizing Member.",
    "proof_url": null,
    "source_order": 6,
    "display_order": 2
  },
  {
    "id": 7,
    "year": "2024",
    "title": "Sustainable Technologies for Advancing Sustainable Development Goals (SDGs)",
    "activity_type": "FDP",
    "institution": "Department of Mechanical Engineering, ANITS",
    "date_text": "16–21 December 2024",
    "duration_text": "6 days",
    "details": "Online ATAL Faculty Development Programme.",
    "proof_url": null,
    "source_order": 7,
    "display_order": 1
  },
  {
    "id": 8,
    "year": "2024",
    "title": "Enhancing Research Excellence: A Comprehensive Exploration of Optimization Techniques",
    "activity_type": "FDP",
    "institution": "GMR Institute of Technology, Rajam, Srikakulam",
    "date_text": "22–26 April 2024",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 8,
    "display_order": 2
  },
  {
    "id": 9,
    "year": "2022",
    "title": "Mechanics of Solids",
    "activity_type": "Guest Lecture",
    "institution": "Avanthi Institute of Engineering and Technology",
    "date_text": "21 & 24 December 2022",
    "duration_text": null,
    "details": "Delivered guest lecture to an audience of about 100.",
    "proof_url": null,
    "source_order": 9,
    "display_order": 1
  },
  {
    "id": 10,
    "year": "2022",
    "title": "Structural and Fatigue Analysis of Mechanical Engineering Components Using ANSYS",
    "activity_type": "Guest Lecture",
    "institution": "Department of Mechanical Engineering, ANITS",
    "date_text": "19–31 December 2022",
    "duration_text": "Two-week Value-Added Course",
    "details": null,
    "proof_url": null,
    "source_order": 10,
    "display_order": 2
  },
  {
    "id": 11,
    "year": "2022",
    "title": "Advancements in Thermal and Renewable Energy Technologies (ATRET-2022)",
    "activity_type": "FDP",
    "institution": "Department of Mechanical Engineering, Lakireddy Bali Reddy College of Engineering",
    "date_text": "04–09 July 2022",
    "duration_text": "6 days",
    "details": null,
    "proof_url": null,
    "source_order": 11,
    "display_order": 3
  },
  {
    "id": 12,
    "year": "2022",
    "title": "Pedagogy to Develop Quality Initiatives: A Student Centric Learning",
    "activity_type": "FDP",
    "institution": "KVSR Siddhartha College of Pharmaceutical Sciences, Vijayawada",
    "date_text": "16–21 August 2022",
    "duration_text": "6 days",
    "details": null,
    "proof_url": null,
    "source_order": 12,
    "display_order": 4
  },
  {
    "id": 13,
    "year": "2022",
    "title": "Vibration Based Product Quality and Tool Condition Monitoring System in Advanced Manufacturing",
    "activity_type": "Training",
    "institution": "Department of Mechanical Engineering, Vadlamudi, Guntur, in collaboration with GITAM",
    "date_text": "18–25 April 2022",
    "duration_text": "National Level Training Programme",
    "details": null,
    "proof_url": null,
    "source_order": 13,
    "display_order": 5
  },
  {
    "id": 14,
    "year": "2022",
    "title": "Nonlinear and Evolutionary Optimization Techniques in Engineering",
    "activity_type": "Training",
    "institution": "GVP College of Engineering, Madhurawada, Visakhapatnam",
    "date_text": "21–26 February 2022",
    "duration_text": "AICTE-ISTE approved programme",
    "details": null,
    "proof_url": null,
    "source_order": 14,
    "display_order": 6
  },
  {
    "id": 15,
    "year": "2022",
    "title": "Material Characterization Techniques",
    "activity_type": "Workshop",
    "institution": "School of Mechanical Engineering, VIT-AP University, Amaravati",
    "date_text": "25–26 February 2022",
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 15,
    "display_order": 7
  },
  {
    "id": 16,
    "year": "2020",
    "title": "3D Modeling of Mechanical Systems using ANSYS",
    "activity_type": "Training",
    "institution": "Entuple Technologies",
    "date_text": "21 April 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 16,
    "display_order": 1
  },
  {
    "id": 17,
    "year": "2020",
    "title": "Additive Manufacturing & 3D Printing",
    "activity_type": "STTP",
    "institution": "Lendi Institute of Engineering and Technology (LIET), Vizianagaram",
    "date_text": "02–07 March 2020",
    "duration_text": "6 days",
    "details": "Short-Term Training Programme funded by AICTE, New Delhi.",
    "proof_url": null,
    "source_order": 17,
    "display_order": 2
  },
  {
    "id": 18,
    "year": "2020",
    "title": "Advanced Manufacturing Enterprise in Digital Era",
    "activity_type": "FDP",
    "institution": "AITAM, Tekkali",
    "date_text": "01–05 June 2020",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 18,
    "display_order": 3
  },
  {
    "id": 19,
    "year": "2020",
    "title": "Brief of Dynamic Analysis using ANSYS",
    "activity_type": "Training",
    "institution": "Entuple Technologies",
    "date_text": "05 May 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 19,
    "display_order": 4
  },
  {
    "id": 20,
    "year": "2020",
    "title": "Entrepreneur's Mindset",
    "activity_type": "Webinar",
    "institution": "ANITS",
    "date_text": "30 June 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 20,
    "display_order": 5
  },
  {
    "id": 21,
    "year": "2020",
    "title": "Python Programming – Intermediate",
    "activity_type": "Workshop",
    "institution": "JAIN Faculty of Engineering and Technology",
    "date_text": "07 June 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 21,
    "display_order": 6
  },
  {
    "id": 22,
    "year": "2020",
    "title": "Python 3.4.3",
    "activity_type": "FDP",
    "institution": "Sou. Venutai Chavan Polytechnic, funded by ICT, MHRD, Government of India",
    "date_text": "11–15 May 2020",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 22,
    "display_order": 7
  },
  {
    "id": 23,
    "year": "2020",
    "title": "Fuzzy Logic and Neural Network Approaches for Engineering Solutions",
    "activity_type": "Workshop",
    "institution": "Journal of Advanced Engineering Research",
    "date_text": "03–04 May 2020",
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 23,
    "display_order": 8
  },
  {
    "id": 24,
    "year": "2020",
    "title": "Introduction to Explicit Dynamics",
    "activity_type": "Training",
    "institution": "Entuple Technologies",
    "date_text": "07 May 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 24,
    "display_order": 9
  },
  {
    "id": 25,
    "year": "2020",
    "title": "LaTeX Training Program",
    "activity_type": "Training",
    "institution": "Sanjay Ghodawat University, Kolhapur, funded by ICT, MHRD, Government of India",
    "date_text": "27 April–02 May 2020",
    "duration_text": "6 days",
    "details": null,
    "proof_url": null,
    "source_order": 25,
    "display_order": 10
  },
  {
    "id": 26,
    "year": "2020",
    "title": "Advanced Materials Characterization Techniques",
    "activity_type": "FDP",
    "institution": "Lendi Institute of Engineering and Technology",
    "date_text": "28–30 May 2020",
    "duration_text": "3 days",
    "details": null,
    "proof_url": null,
    "source_order": 26,
    "display_order": 11
  },
  {
    "id": 27,
    "year": "2020",
    "title": "MATLAB Based Teaching-Learning",
    "activity_type": "STTP",
    "institution": "D. Y. Patil University, Design Tech",
    "date_text": "18–22 May 2020",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 27,
    "display_order": 12
  },
  {
    "id": 28,
    "year": "2020",
    "title": "Computational Tools and Techniques: MATLAB, ANSYS",
    "activity_type": "FDP",
    "institution": "Government College of Engineering, Karad, TEQIP III",
    "date_text": "27 April–01 May 2020",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 28,
    "display_order": 13
  },
  {
    "id": 29,
    "year": "2020",
    "title": "Material Characterization Tools and Techniques",
    "activity_type": "Training",
    "institution": "Entuple Technologies",
    "date_text": "23–25 April 2020",
    "duration_text": "3 days",
    "details": null,
    "proof_url": null,
    "source_order": 29,
    "display_order": 14
  },
  {
    "id": 30,
    "year": "2020",
    "title": "Fundamental of Strength of Materials",
    "activity_type": "Webinar",
    "institution": "Chennai Institute of Technology",
    "date_text": "29 April 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 30,
    "display_order": 15
  },
  {
    "id": 31,
    "year": "2020",
    "title": "National Level Quiz on NAAC",
    "activity_type": "Quiz",
    "institution": "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering",
    "date_text": "26 May 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 31,
    "display_order": 16
  },
  {
    "id": 32,
    "year": "2020",
    "title": "Simulation Based Product Design (Foundation)",
    "activity_type": "Training",
    "institution": "Entuple Technologies",
    "date_text": "27 April–01 May 2020",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 32,
    "display_order": 17
  },
  {
    "id": 33,
    "year": "2020",
    "title": "University Industry Linkage – Different Mechanisms",
    "activity_type": "Webinar",
    "institution": "Audisankara Group of Institutions, Bangalore",
    "date_text": "02 May 2020",
    "duration_text": "1 day",
    "details": null,
    "proof_url": null,
    "source_order": 33,
    "display_order": 18
  },
  {
    "id": 34,
    "year": "2020",
    "title": "Failure and Damage Mechanics of High Performance Engineering Materials",
    "activity_type": "STTP",
    "institution": "ANITS",
    "date_text": "13–18 July 2020",
    "duration_text": "6 days",
    "details": null,
    "proof_url": null,
    "source_order": 34,
    "display_order": 19
  },
  {
    "id": 35,
    "year": "2019",
    "title": "Innovative Mechanisms and Standards for Assuring Quality in Higher Education Institutions",
    "activity_type": "Conference",
    "institution": "KL University, Guntur",
    "date_text": "22–23 March 2019",
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 35,
    "display_order": 1
  },
  {
    "id": 36,
    "year": "2019",
    "title": "Two-Day Training Course",
    "activity_type": "Resource Person",
    "institution": "Avanthi Engineering College, Narsipatnam",
    "date_text": null,
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 36,
    "display_order": 2
  },
  {
    "id": 37,
    "year": "2018",
    "title": "International Conference on Learning and Innovative Engineering Technologies (ICLIET-2018)",
    "activity_type": "Conference",
    "institution": "Lendi Institute of Engineering and Sciences, Vizianagaram",
    "date_text": null,
    "duration_text": null,
    "details": "Conference participation and technical paper presentation.",
    "proof_url": null,
    "source_order": 37,
    "display_order": 1
  },
  {
    "id": 38,
    "year": "2018",
    "title": "Advances in Hybrid Polymer Composite Engineering and Applications",
    "activity_type": "FDP",
    "institution": "Department of Mechanical Engineering, ANITS",
    "date_text": "11–16 June 2018",
    "duration_text": "One week",
    "details": "AICTE-ISTE sponsored induction programme.",
    "proof_url": null,
    "source_order": 38,
    "display_order": 2
  },
  {
    "id": 39,
    "year": "2016",
    "title": "International Conference on Advances in Advanced Materials and Manufacturing (ICAAMM-2016)",
    "activity_type": "Conference",
    "institution": "MLR Institute of Technology, Hyderabad",
    "date_text": null,
    "duration_text": null,
    "details": "Conference participation and technical paper presentation.",
    "proof_url": null,
    "source_order": 39,
    "display_order": 1
  },
  {
    "id": 40,
    "year": "2016",
    "title": "CFD & Software Training",
    "activity_type": "Workshop",
    "institution": "ANITS",
    "date_text": "05–06 August 2016",
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 40,
    "display_order": 2
  },
  {
    "id": 41,
    "year": "2015",
    "title": "3D Student Design Challenge",
    "activity_type": "Training",
    "institution": "ANITS",
    "date_text": null,
    "duration_text": "1 day",
    "details": "Conducted the training course as co-coordinator.",
    "proof_url": null,
    "source_order": 41,
    "display_order": 1
  },
  {
    "id": 42,
    "year": "2015",
    "title": "Quality Improvement Programme",
    "activity_type": "Training",
    "institution": "NITTTR Chennai, ANITS",
    "date_text": null,
    "duration_text": null,
    "details": null,
    "proof_url": null,
    "source_order": 42,
    "display_order": 2
  },
  {
    "id": 43,
    "year": "2015",
    "title": "Computational Fluid Dynamics",
    "activity_type": "FDP",
    "institution": "SASTRA University, Thanjavur",
    "date_text": "01–05 June 2015",
    "duration_text": "5 days",
    "details": null,
    "proof_url": null,
    "source_order": 43,
    "display_order": 3
  },
  {
    "id": 44,
    "year": "2014",
    "title": "International Colloquium on Materials, Manufacturing and Metrology (ICMMM-2014)",
    "activity_type": "Conference",
    "institution": "Mechanical Engineering Department, IIT Madras",
    "date_text": "08–09 August 2014",
    "duration_text": "2 days",
    "details": null,
    "proof_url": null,
    "source_order": 44,
    "display_order": 1
  },
  {
    "id": 45,
    "year": "2014",
    "title": "Emerging Trends in Teaching Methodology of Engineering Education",
    "activity_type": "Workshop",
    "institution": "ANITS",
    "date_text": "01 March 2014",
    "duration_text": null,
    "details": null,
    "proof_url": null,
    "source_order": 45,
    "display_order": 2
  },
  {
    "id": 46,
    "year": "2013",
    "title": "Manufacturing Automation: Present and Future",
    "activity_type": "Seminar",
    "institution": "Department of Mechanical Engineering, ANITS",
    "date_text": "13–14 December 2013",
    "duration_text": "2 days",
    "details": "AICTE sponsored National Seminar.",
    "proof_url": null,
    "source_order": 46,
    "display_order": 1
  }
]$activity_seed$::jsonb)
as a(id integer, year text, title text, activity_type text, institution text,
date_text text, duration_text text, details text, proof_url text,
source_order integer, display_order integer);
do $$
begin
  if (select jsonb_agg(label order by display_order) from public.activity_categories)
    is distinct from $activity_categories$["Conference","FDP","Organizing","Guest Lecture","Training","Workshop","STTP","Webinar","Quiz","Resource Person","Seminar"]$activity_categories$::jsonb then
    raise exception 'Activity categories differ from committed source';
  end if;
  if exists(select 1 from public.activities a left join phase3c_expected e using(id)
    where e.id is null or (to_jsonb(a)-'created_at'-'updated_at') is distinct from to_jsonb(e)) then
    raise exception 'Existing activities conflict with source; no records changed';
  end if;
end;
$$;
insert into public.activities
(id,year,title,activity_type,institution,date_text,duration_text,details,proof_url,source_order,display_order)
select e.* from phase3c_expected e where not exists(select 1 from public.activities a where a.id=e.id);
do $$
begin
  if (select count(*) from public.activities) <> 46 or exists(
    select 1 from phase3c_expected e left join public.activities a using(id)
    where (to_jsonb(a)-'created_at'-'updated_at') is distinct from to_jsonb(e)) then
    raise exception 'Activity field-by-field verification failed';
  end if;
end;
$$;
select setval('public.activities_id_seq',greatest(
  (select max(id) from public.activities),(select last_value from public.activities_id_seq)),true);
commit;

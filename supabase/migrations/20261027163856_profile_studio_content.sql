begin;

alter table public.profile_settings
  add column education_records jsonb not null default '[]'::jsonb
    check (jsonb_typeof(education_records) = 'array'),
  add column research_area_records jsonb not null default '[]'::jsonb
    check (jsonb_typeof(research_area_records) = 'array'),
  add column experience_records jsonb not null default '[]'::jsonb
    check (jsonb_typeof(experience_records) = 'array');

update public.profile_settings
set education_records = '[
  {"year":"June 2026","degree":"Master of Technology","institution":"ANITS Engineering College","field":"AI-ML in CSE Department","detail":"","proof":"https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link","marksProof":""},
  {"year":"February 2026","degree":"Doctor of Philosophy","institution":"Andhra University, Visakhapatnam","field":"Mechanical Engineering","detail":"Research topic: Polymer Composite Gears","proof":"https://drive.google.com/file/d/1l3ptgzeV6SJ6OuZT87A5wBh08N20rsET/view?usp=drive_link","marksProof":""},
  {"year":"2010","degree":"Master of Engineering","institution":"GITAM Engineering College","field":"CAD/CAM","detail":"","proof":"https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link","marksProof":"https://drive.google.com/file/d/11Z8AnTyeOosboc7Goq1L43miUQL4xqAl/view?usp=drive_link"},
  {"year":"2005","degree":"Bachelor of Technology","institution":"SISTAM Engineering College, Srikakulam","field":"Mechanical Engineering","detail":"","proof":"https://drive.google.com/file/d/1Y9KTMP0Ku-hv7BsPXQbXmxZQlFMoPTB/view?usp=drive_link","marksProof":"https://drive.google.com/file/d/1VI6zDS6c45rjbBvI1-lcno05B2XhgnRC/view?usp=drive_link"},
  {"year":"2000","degree":"Intermediate","institution":"BVK Junior College, Visakhapatnam","field":"M.P.C","detail":"","proof":"https://drive.google.com/file/d/1Tp9SSMSpy1ERr6-8sJ0gFW6NPtHJNC7C/view?usp=drive_link","marksProof":""},
  {"year":"1998","degree":"School (X)","institution":"GNH School, Visakhapatnam","field":"School Education","detail":"","proof":"https://drive.google.com/file/d/1Xru84LRQnTJxZrf5dhtpw1aJrk6NEgO/view?usp=drive_link","marksProof":""}
]'::jsonb,
research_area_records = '[
  {"title":"Polymer Composite Gears","text":"Design, analysis, contact stress and wear behaviour of polymer and hybrid composite gears."},
  {"title":"Advanced Manufacturing","text":"Engineering analysis, manufacturing processes, material characterization and advanced manufacturing systems."},
  {"title":"Artificial Intelligence & Machine Learning","text":"Machine learning, intelligent prediction, data-driven modelling and engineering applications."},
  {"title":"Finite Element Analysis","text":"Structural, contact stress, fatigue and numerical analysis of mechanical engineering components."},
  {"title":"Optimization Techniques","text":"Multi-objective optimization, intelligent optimization algorithms and engineering design optimization."},
  {"title":"Electric & Hybrid Vehicles","text":"Electric vehicle systems, battery health, energy management and intelligent vehicle control."}
]'::jsonb,
experience_records = '[
  {"period":"Aug 2012 – Present","role":"Assistant Professor","institution":"Anil Neerukonda Institute of Technology and Sciences (ANITS)","department":"Department of Mechanical Engineering"},
  {"period":"June 2010 – July 2012","role":"Assistant Professor","institution":"VIZAG Institute of Technology, Visakhapatnam","department":"Department of Mechanical Engineering"},
  {"period":"June 2008 – May 2010","role":"Assistant Professor","institution":"Sri Vaishnavi College of Engineering, Srikakulam","department":"Mechanical Engineering"},
  {"period":"Jan 2006 – July 2006","role":"Jr. CAD Engineer","institution":"Info Solutions Pvt. Ltd.","department":"CAD Engineering"}
]'::jsonb
where singleton is true;

comment on column public.profile_settings.education_records is 'Admin-managed education entries shown publicly and included in generated resumes.';
comment on column public.profile_settings.research_area_records is 'Admin-managed research areas shown publicly and included in generated resumes.';
comment on column public.profile_settings.experience_records is 'Admin-managed experience entries shown publicly and included in generated resumes.';

commit;

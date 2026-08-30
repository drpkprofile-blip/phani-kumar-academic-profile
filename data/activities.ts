export type ActivityType =
  | "FDP"
  | "Workshop"
  | "Training"
  | "STTP"
  | "Conference"
  | "Seminar"
  | "Guest Lecture"
  | "Webinar"
  | "Quiz"
  | "Resource Person"
  | "Organizing";

export type AcademicActivity = {
  year: string;
  title: string;
  type: ActivityType;
  institution: string;
  date?: string;
  duration?: string;
  details?: string;
  proofUrl?: string;
};

export const activities: AcademicActivity[] = [
  {
    year: "2026",
    title:
      "Polymer Composites for Textile Applications: A Review of Materials, Processing and Performance",
    type: "Conference",
    institution: "The Institution of Engineers (India), Madurai Local Centre",
    date: "07–08 August 2026",
    details: "39th National Convention of Textile Engineers and National Seminar. Technical paper presented.",
  },
  {
    year: "2026",
    title:
      "AI-Driven Multi-Objective Optimization of Hybrid PA66 Composites Using ML and MPA",
    type: "Conference",
    institution: "Anil Neerukonda Institute of Technology and Sciences (ANITS)",
    date: "03–04 July 2026",
    details:
      "ICANITS 2026. Technical paper presented. Received the Best Paper Award.",
    proofUrl:
      "https://drive.google.com/file/d/1TzMj1rdlHN1mUZZqJ7dZEY4Jw9wt0aTT/view?usp=drive_link",
  },
  {
    year: "2026",
    title:
      "Recent Advances in Additive Manufacturing, AI and Robotic Systems",
    type: "FDP",
    institution: "Department of Mechanical Engineering, ANITS, Visakhapatnam",
    date: "15–18 June 2026",
    duration: "4 days",
  },
  {
    year: "2026",
    title: "AI-Enabled Pedagogy and Outcome Based Education",
    type: "FDP",
    institution: "ANITS, Visakhapatnam",
    date: "08–13 June 2026",
    duration: "6 days",
  },

  {
    year: "2025",
    title: "Fusion CAD and Generative Design",
    type: "FDP",
    institution: "ANITS, Visakhapatnam",
    date: "21–25 April 2025",
    duration: "5 days",
  },
  {
    year: "2025",
    title:
      "1st International Conference on Material, Design Innovations, and Energy Systems Optimization for Industrial Applications (ICMDESO-2025)",
    type: "Organizing",
    institution: "ANITS, Visakhapatnam",
    date: "28–29 March 2025",
    details: "Served as an Organizing Member.",
  },

  {
    year: "2024",
    title:
      "Sustainable Technologies for Advancing Sustainable Development Goals (SDGs)",
    type: "FDP",
    institution: "Department of Mechanical Engineering, ANITS",
    date: "16–21 December 2024",
    duration: "6 days",
    details: "Online ATAL Faculty Development Programme.",
  },
  {
    year: "2024",
    title:
      "Enhancing Research Excellence: A Comprehensive Exploration of Optimization Techniques",
    type: "FDP",
    institution: "GMR Institute of Technology, Rajam, Srikakulam",
    date: "22–26 April 2024",
    duration: "5 days",
  },

  {
    year: "2022",
    title: "Mechanics of Solids",
    type: "Guest Lecture",
    institution: "Avanthi Institute of Engineering and Technology",
    date: "21 & 24 December 2022",
    details: "Delivered guest lecture to an audience of about 100.",
  },
  {
    year: "2022",
    title:
      "Structural and Fatigue Analysis of Mechanical Engineering Components Using ANSYS",
    type: "Guest Lecture",
    institution: "Department of Mechanical Engineering, ANITS",
    date: "19–31 December 2022",
    duration: "Two-week Value-Added Course",
  },
  {
    year: "2022",
    title: "Advancements in Thermal and Renewable Energy Technologies (ATRET-2022)",
    type: "FDP",
    institution:
      "Department of Mechanical Engineering, Lakireddy Bali Reddy College of Engineering",
    date: "04–09 July 2022",
    duration: "6 days",
  },
  {
    year: "2022",
    title: "Pedagogy to Develop Quality Initiatives: A Student Centric Learning",
    type: "FDP",
    institution:
      "KVSR Siddhartha College of Pharmaceutical Sciences, Vijayawada",
    date: "16–21 August 2022",
    duration: "6 days",
  },
  {
    year: "2022",
    title:
      "Vibration Based Product Quality and Tool Condition Monitoring System in Advanced Manufacturing",
    type: "Training",
    institution:
      "Department of Mechanical Engineering, Vadlamudi, Guntur, in collaboration with GITAM",
    date: "18–25 April 2022",
    duration: "National Level Training Programme",
  },
  {
    year: "2022",
    title: "Nonlinear and Evolutionary Optimization Techniques in Engineering",
    type: "Training",
    institution: "GVP College of Engineering, Madhurawada, Visakhapatnam",
    date: "21–26 February 2022",
    duration: "AICTE-ISTE approved programme",
  },
  {
    year: "2022",
    title: "Material Characterization Techniques",
    type: "Workshop",
    institution: "School of Mechanical Engineering, VIT-AP University, Amaravati",
    date: "25–26 February 2022",
    duration: "2 days",
  },

  {
    year: "2020",
    title: "3D Modeling of Mechanical Systems using ANSYS",
    type: "Training",
    institution: "Entuple Technologies",
    date: "21 April 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Additive Manufacturing & 3D Printing",
    type: "STTP",
    institution: "Lendi Institute of Engineering and Technology (LIET), Vizianagaram",
    date: "02–07 March 2020",
    duration: "6 days",
    details: "Short-Term Training Programme funded by AICTE, New Delhi.",
  },
  {
    year: "2020",
    title: "Advanced Manufacturing Enterprise in Digital Era",
    type: "FDP",
    institution: "AITAM, Tekkali",
    date: "01–05 June 2020",
    duration: "5 days",
  },
  {
    year: "2020",
    title: "Brief of Dynamic Analysis using ANSYS",
    type: "Training",
    institution: "Entuple Technologies",
    date: "05 May 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Entrepreneur's Mindset",
    type: "Webinar",
    institution: "ANITS",
    date: "30 June 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Python Programming – Intermediate",
    type: "Workshop",
    institution: "JAIN Faculty of Engineering and Technology",
    date: "07 June 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Python 3.4.3",
    type: "FDP",
    institution:
      "Sou. Venutai Chavan Polytechnic, funded by ICT, MHRD, Government of India",
    date: "11–15 May 2020",
    duration: "5 days",
  },
  {
    year: "2020",
    title: "Fuzzy Logic and Neural Network Approaches for Engineering Solutions",
    type: "Workshop",
    institution: "Journal of Advanced Engineering Research",
    date: "03–04 May 2020",
    duration: "2 days",
  },
  {
    year: "2020",
    title: "Introduction to Explicit Dynamics",
    type: "Training",
    institution: "Entuple Technologies",
    date: "07 May 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "LaTeX Training Program",
    type: "Training",
    institution:
      "Sanjay Ghodawat University, Kolhapur, funded by ICT, MHRD, Government of India",
    date: "27 April–02 May 2020",
    duration: "6 days",
  },
  {
    year: "2020",
    title: "Advanced Materials Characterization Techniques",
    type: "FDP",
    institution: "Lendi Institute of Engineering and Technology",
    date: "28–30 May 2020",
    duration: "3 days",
  },
  {
    year: "2020",
    title: "MATLAB Based Teaching-Learning",
    type: "STTP",
    institution: "D. Y. Patil University, Design Tech",
    date: "18–22 May 2020",
    duration: "5 days",
  },
  {
    year: "2020",
    title: "Computational Tools and Techniques: MATLAB, ANSYS",
    type: "FDP",
    institution: "Government College of Engineering, Karad, TEQIP III",
    date: "27 April–01 May 2020",
    duration: "5 days",
  },
  {
    year: "2020",
    title: "Material Characterization Tools and Techniques",
    type: "Training",
    institution: "Entuple Technologies",
    date: "23–25 April 2020",
    duration: "3 days",
  },
  {
    year: "2020",
    title: "Fundamental of Strength of Materials",
    type: "Webinar",
    institution: "Chennai Institute of Technology",
    date: "29 April 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "National Level Quiz on NAAC",
    type: "Quiz",
    institution:
      "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering",
    date: "26 May 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Simulation Based Product Design (Foundation)",
    type: "Training",
    institution: "Entuple Technologies",
    date: "27 April–01 May 2020",
    duration: "5 days",
  },
  {
    year: "2020",
    title: "University Industry Linkage – Different Mechanisms",
    type: "Webinar",
    institution: "Audisankara Group of Institutions, Bangalore",
    date: "02 May 2020",
    duration: "1 day",
  },
  {
    year: "2020",
    title: "Failure and Damage Mechanics of High Performance Engineering Materials",
    type: "STTP",
    institution: "ANITS",
    date: "13–18 July 2020",
    duration: "6 days",
  },

  {
    year: "2019",
    title:
      "Innovative Mechanisms and Standards for Assuring Quality in Higher Education Institutions",
    type: "Conference",
    institution: "KL University, Guntur",
    date: "22–23 March 2019",
    duration: "2 days",
  },
  {
    year: "2019",
    title: "Two-Day Training Course",
    type: "Resource Person",
    institution: "Avanthi Engineering College, Narsipatnam",
    duration: "2 days",
  },

  {
    year: "2018",
    title:
      "International Conference on Learning and Innovative Engineering Technologies (ICLIET-2018)",
    type: "Conference",
    institution: "Lendi Institute of Engineering and Sciences, Vizianagaram",
    details: "Conference participation and technical paper presentation.",
  },
  {
    year: "2018",
    title:
      "Advances in Hybrid Polymer Composite Engineering and Applications",
    type: "FDP",
    institution: "Department of Mechanical Engineering, ANITS",
    date: "11–16 June 2018",
    duration: "One week",
    details: "AICTE-ISTE sponsored induction programme.",
  },

  {
    year: "2016",
    title:
      "International Conference on Advances in Advanced Materials and Manufacturing (ICAAMM-2016)",
    type: "Conference",
    institution: "MLR Institute of Technology, Hyderabad",
    details: "Conference participation and technical paper presentation.",
  },
  {
    year: "2016",
    title: "CFD & Software Training",
    type: "Workshop",
    institution: "ANITS",
    date: "05–06 August 2016",
    duration: "2 days",
  },

  {
    year: "2015",
    title: "3D Student Design Challenge",
    type: "Training",
    institution: "ANITS",
    duration: "1 day",
    details: "Conducted the training course as co-coordinator.",
  },
  {
    year: "2015",
    title: "Quality Improvement Programme",
    type: "Training",
    institution: "NITTTR Chennai, ANITS",
  },
  {
    year: "2015",
    title: "Computational Fluid Dynamics",
    type: "FDP",
    institution: "SASTRA University, Thanjavur",
    date: "01–05 June 2015",
    duration: "5 days",
  },

  {
    year: "2014",
    title: "International Colloquium on Materials, Manufacturing and Metrology (ICMMM-2014)",
    type: "Conference",
    institution: "Mechanical Engineering Department, IIT Madras",
    date: "08–09 August 2014",
    duration: "2 days",
  },
  {
    year: "2014",
    title: "Emerging Trends in Teaching Methodology of Engineering Education",
    type: "Workshop",
    institution: "ANITS",
    date: "01 March 2014",
  },

  {
    year: "2013",
    title: "Manufacturing Automation: Present and Future",
    type: "Seminar",
    institution: "Department of Mechanical Engineering, ANITS",
    date: "13–14 December 2013",
    duration: "2 days",
    details: "AICTE sponsored National Seminar.",
  },
];

export const activityYears = Array.from(
  new Set(activities.map((activity) => activity.year))
).sort((a, b) => Number(b) - Number(a));

export const activityTypes = Array.from(
  new Set(activities.map((activity) => activity.type))
);
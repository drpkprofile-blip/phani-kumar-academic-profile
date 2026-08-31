export type ProfileLink = {
  label: string;
  href: string;
};

export type AcademicIdentity = {
  label: string;
  value: string;
  href?: string;
};

export const profile = {
  name: "Dr. Phani Kumar Simhadri",

  firstName: "Dr. Phani",

  lastName: "Kumar Simhadri",

  qualifications: "B. Tech.[Mech], M.E.[CAD/CAM], M. Tech (AI-ML), PhD[AU].",

  designation: "Assistant Professor",

  department: "Mechanical Engineering",

  institution:
    "Anil Neerukonda Institute of Technology and Sciences (ANITS)",

  profileLabel: "ACADEMIC & RESEARCH PROFILE",

  description:
    "Academic and researcher working in mechanical engineering, polymer composite materials, intelligent optimization, artificial intelligence, and advanced engineering systems.",

  email: "sphani.me@anits.edu.in",

  phone: "+91 9866701200",

  address:
    "D. No 10-35-46, Bank Colony, Bheemunipatnam, Visakhapatnam District, Andhra Pradesh, India - 531163.",

  photo: "/phani-photo.png",

  academicIdentity: [
    {
      label: "ORCID ID",
      value: "0000-0002-4097-2635",
      href: "",
    },
    {
      label: "Scopus ID",
      value: "57738906200",
      href: "",
    },
    {
      label: "Researcher ID",
      value: "ABB-7262-2022",
      href: "",
    },
    {
      label: "Google Scholar ID",
      value: "ASjE9TgAAAAJ",
      href: "https://scholar.google.com/citations?view_op=list_works&hl=en&user=ASjE9TgAAAAJ&pagesize=80&sortby=pubdate",
    },
  ] satisfies AcademicIdentity[],

  profileLinks: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/dr-phani-kumar-simhadri-bb7948b?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/invites/contact/?i=oraf9tu717g0&utm_content=3nupwnq",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/phanikumarsimha",
    },
    {
      label: "Google Scholar",
      href: "https://scholar.google.com/citations?view_op=list_works&hl=en&user=ASjE9TgAAAAJ&pagesize=80&sortby=pubdate",
    },
    {
      label: "ResearchGate",
      href: "https://www.researchgate.net/profile/Phani-Simhadri?ev=hdr_xprf",
    },
    {
      label: "IRINS",
      href: "",
    },
  ] satisfies ProfileLink[],

  youtubeChannel: {
    title: "Code & CAD with PK",
    href: "https://youtube.com/@codeandcadwithpk?si=vaESyvrIBw5tMVYi",
    image: "/youtube-channel-logo.png",
  },

  technicalTools: [
    "Python Programming",
    "SOLID WORKS",
    "ANSYS",
    "AUTO CAD", 
  ],

  skills: [
    "Evaluations and assessments",
    "Publications",
    "Technology-based learning tools",
    "Student research advisement",
  ],

  researchInterests: [
    "Polymer Composite Gears",
    "Tribology",
    "Contact Stress Analysis",
    "Finite Element Analysis",
    "Machine Learning",
    "Artificial Intelligence",
    "Optimization",
    "Electric Vehicles",
    "Intelligent Control Systems",
    "Advanced Engineering Systems",
  ],
} as const;
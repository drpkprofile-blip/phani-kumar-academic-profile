export type Education = {
  year: string;
  degree: string;
  institution: string;
  field: string;
  detail?: string;
  proof?: string;
  marksProof?: string;
};

export const education: Education[] = [
  {
    year: "February 2026",
    degree: "Doctor of Philosophy",
    institution: "Andhra University, Visakhapatnam",
    field: "Mechanical Engineering",
    detail: "Research topic: Polymer Composite Gears",
    proof:
      "https://drive.google.com/file/d/1l3ptgzeV6SJ6OuZT87A5wBh08N20rsET/view?usp=drive_link",
  },
  {
    year: "June 2026",
    degree: "Master of Technology",
    institution: "ANITS Engineering College",
    field: "AI-ML in CSE Department",
    proof:
      "https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link",
  },
  {
    year: "2010",
    degree: "Master of Engineering",
    institution: "GITAM Engineering College",
    field: "CAD/CAM",
    proof:
      "https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link",
    marksProof:
      "https://drive.google.com/file/d/11Z8AnTyeOosboc7Goq1L43miUQL4xqAl/view?usp=drive_link",

  },
  {
    year: "2005",
    degree: "Bachelor of Technology",
    institution: "SISTAM Engineering College, Srikakulam",
    field: "Mechanical Engineering",
    proof:
      "https://drive.google.com/file/d/1Y9KTMP0Ku-hv7BsPXQbXmxZQlFMoPTB/view?usp=drive_link",
    marksProof:
      "https://drive.google.com/file/d/1VI6zDS6c45rjbBvI1-lcno05B2XhgnRC/view?usp=drive_link",

  },
  {
    year: "2000",
    degree: "Intermediate",
    institution: "BVK Junior College, Visakhapatnam",
    field: "M.P.C",
    proof:
      "https://drive.google.com/file/d/1Tp9SSMSpy1ERr6-8sJ0gFW6NPtHJNC7C/view?usp=drive_link",
  },
  {
    year: "1998",
    degree: "School (X)",
    institution: "GNH School, Visakhapatnam",
    field: "School Education",
    proof:
      "https://drive.google.com/file/d/1Xru84LRQnTJxZrf5dhtpw1aJrk6NEgO/view?usp=drive_link",
  },
];

const monthNumbers: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function explicitEducationDate(value: string): number {
  const monthYear = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = monthNumbers[monthYear[1].toLowerCase()];
    if (month) return Number(monthYear[2]) * 100 + month;
  }
  const year = value.match(/^(\d{4})$/);
  return year ? Number(year[1]) * 100 : 0;
}

export const educationNewestFirst = [...education].sort((a, b) => explicitEducationDate(b.year) - explicitEducationDate(a.year));

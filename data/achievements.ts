export type Achievement = {
  number: string;
  title: string;
  text: string;
  proof?: string;
  extraProof?: string;
};

export const achievements: Achievement[] = [
  {
    number: "01",
    title: "Best Paper Award",
    text: "Received the Best Paper Award at the International Conference on ICANITS-2026.",
    proof:
      "https://drive.google.com/file/d/1TzMj1rdlHN1mUZZqJ7dZEY4Jw9wt0aTT/view?usp=drive_link",
  },
  {
    number: "02",
    title: "NPTEL Discipline Star",
    text: "Received NPTEL Discipline Star Certificate from IIT Madras in 2026 and attended the NPTEL Star Event at IIT Tirupati.",
    proof:
      "https://drive.google.com/file/d/1G2s4OHeQUODHIHDrkOWu2pY1U6kQY0bf/view?usp=drive_link",
    extraProof:
      "https://drive.google.com/file/d/1SslACwcOG3n2UaOmu1QdAqh-4-JoPOvH/view?usp=drive_link",
  },
  {
    number: "03",
    title: "NPTEL Believer Certificate",
    text: "Received NPTEL Believer Certificate from IIT Madras in 2022.",
    proof:
      "https://drive.google.com/file/d/1Bh3tLtVVGmn9-REa0eZm5wesd6T5ggE2/view?usp=drive_link",
  },
  {
    number: "04",
    title: "Research Seed Money",
    text: "Sanctioned Rs. 1,50,000/- from ANITS for research on contact stresses and wear rate of plastic gears mounted on shafts with misalignment.",
    proof:
      "https://drive.google.com/drive/folders/1MndZ9k4UZH06eGZS1id8HpoVXMWl8pXm?usp=drive_link",
  },
];

export type Patent = {
  id: number;
  applicationNumber: string;
  filingDate: string;
  publicationDate: string;
  title: string;
  journalNumber: string;
  pageNumber: string;
  proofUrl?: string;
};

export const patents: Patent[] = [
  {
    id: 1,
    applicationNumber: "202141030245 A",
    filingDate: "2021-07-06",
    publicationDate: "2021-07-16",
    title: "PROCESS OF PLASTIC WASTE FOR PRODUCTS OF BUILDING MATERIALS WITH PLASTIC EXTRUSION METHOD",
    journalNumber: "29/2021",
    pageNumber: "31374",
  },
];

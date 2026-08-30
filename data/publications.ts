export type Publication = {
  id: number;
  year: string;
  title: string;
  journal: string;
  indexing: string[];
  doi?: string;
  url?: string;

  /*
   * Google Drive PDF proof.
   *
   * Keep empty until you have the actual
   * Google Drive sharing URL for this paper.
   */
  proof?: string;
  pdfUrl?: string;

  /*
   * Show Impact Factor only when this value exists.
   */
  impactFactor?: number;

  type?:
    | "Journal Article"
    | "Book Chapter"
    | "Conference Proceeding";
};

export const publications: Publication[] = [
  {
    id: 1,
    year: "2026",
    title:
      "Machine learning assisted development and finite element based multi-objective optimization of Al6061/WS2/TiO2 hybrid composite spur gears",
    journal:
      "International Journal on Interactive Design and Manufacturing (IJIDeM), 2026/08",
    indexing: ["Q2-SCOPUS", "ESCI"],
    doi: "10.1007/s12008-026-02666-7",
    url:
      "https://doi.org/10.1007/s12008-026-02666-7",
    proof: "",
    impactFactor: 2.8,
    type: "Journal Article",
  },

  {
    id: 2,
    year: "2026",
    title:
      "AI-Driven Multi-Objective Optimization of Hybrid PA66 Composites Using ML and MPA",
    journal:
      "ICANITS 2026, International Conference organized by ANITS",
    indexing: ["SCOPUS"],
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 3,
    year: "2026",
    title:
      "Machine Learning-Based Optimization and Validation of Hybrid PA66/GO/TiO₂ Nanocomposites for Polymer Gear Applications",
    journal:
      "Engineering Research Express, 2026",
    indexing: ["Q2-SCOPUS", "ESCI"],
    doi:
      "10.1088/2631-8695/ae78a6",
    url:
      "https://doi.org/10.1088/2631-8695/ae78a6",
    proof: "",
    impactFactor: 1.6,
    type: "Journal Article",
  },

  {
    id: 4,
    year: "2026",
    title:
      "Experimental Investigation of Contact Stress and Wear Behaviour of Nylon 66/Al2O3/WS2/TiO2 Hybrid Composite Spur Gears",
    journal:
      "Journal of the Institution of Engineers (India): Series D, 2026",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s40033-026-01038-5",
    url:
      "https://doi.org/10.1007/s40033-026-01038-5",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 5,
    year: "2026",
    title:
      "An adaptive super-twisting sliding mode control strategy for energy and torque optimisation in hydrogen fuel cell electric vehicles",
    journal:
      "International Journal of Mathematical Modelling and Numerical Optimisation, Volume 16, 2026",
    indexing: ["Q3-SCOPUS"],
    doi:
      "10.1504/IJMMNO.2026.153032",
    url:
      "https://doi.org/10.1504/IJMMNO.2026.153032",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 6,
    year: "2026",
    title:
      "Simulation and experimental investigation of strain behavior in hybrid reinforced polymer spur gears under misalignment conditions",
    journal:
      "International Journal on Interactive Design and Manufacturing (IJIDeM), 2026, Volume 20, Issue 2, Pages 1051-1067",
    indexing: ["Q2-SCOPUS", "ESCI"],
    doi:
      "10.1007/s12008-025-02450-z",
    url:
      "https://doi.org/10.1007/s12008-025-02450-z",
    proof: "",
    impactFactor: 2.5,
    type: "Journal Article",
  },

  {
    id: 7,
    year: "2025",
    title:
      "Optimized control strategies for BLDC motor in sustainable energy systems: enhancing stability and performance through intelligent controllers, filtering techniques and internal model control",
    journal:
      "Global Energy Interconnection, Elsevier, 2025",
    indexing: ["Q1-SCOPUS"],
    doi:
      "10.1016/j.gloei.2025.09.004",
    url:
      "https://doi.org/10.1016/j.gloei.2025.09.004",
    proof: "",
    impactFactor: 3.9,
    type: "Journal Article",
  },

  {
    id: 8,
    year: "2025",
    title:
      "A robust machine learning-based system for battery grading and lifecycle prediction for electric vehicle applications",
    journal:
      "International Journal of Information Technology, Springer, 2025, Volume 17, Pages 4767-4777",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s41870-025-02712-9",
    url:
      "https://doi.org/10.1007/s41870-025-02712-9",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 9,
    year: "2025",
    title:
      "Modelling, optimisation, and experimental evaluation of predictive maintenance strategies for LiFePO₄ battery health in e-bikes",
    journal:
      "International Journal of Mathematical Modelling and Numerical Optimisation, 2025",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1504/IJMMNO.2026.10073645",
    url:
      "https://doi.org/10.1504/IJMMNO.2026.10073645",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 10,
    year: "2024",
    title:
      "Cyber-physical systems for hybrid braking control techniques in hybrid electric vehicles",
    journal:
      "International Journal of Information Technology, Springer Nature Singapore, 2024",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s41870-024-02184-3",
    url:
      "https://doi.org/10.1007/s41870-024-02184-3",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 11,
    year: "2024",
    title:
      "Enhancing HDPE Properties: Impact of Nano-TiO2 and Nano-SiO2 Particles on Mechanical Properties and Wear Resistance",
    journal:
      "Journal of the Institution of Engineers (India): Series D, Volume 106, Pages 1603-1617",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s40033-024-00758-w",
    url:
      "https://doi.org/10.1007/s40033-024-00758-w",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 12,
    year: "2023",
    title:
      "A Dual-pronged approach for evaluation of contact stresses in nylon hybrid composite gears under misalignment",
    journal:
      "Engineering Research Express, Volume 5, Number 4, 2023",
    indexing: ["Q2-SCOPUS", "ESCI"],
    doi:
      "10.1088/2631-8695/ad0b61",
    url:
      "https://doi.org/10.1088/2631-8695/ad0b61",
    proof: "",
    impactFactor: 1.5,
    type: "Journal Article",
  },

  {
    id: 13,
    year: "2023",
    title:
      "An integrated approach for contact stress analysis of aluminium composite gears through finite element analysis and experimental test rig testing under misalignment",
    journal:
      "Journal of the Institution of Engineers (India): Series D, Volume 105, Issue 2, Pages 643-653",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s40033-023-00510-w",
    url:
      "https://doi.org/10.1007/s40033-023-00510-w",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 14,
    year: "2023",
    title:
      "Comparative study on damping performance of different shape memory polymers",
    journal:
      "Materials Today: Proceedings, Elsevier, 2023",
    indexing: [],
    doi:
      "10.1016/j.matpr.2023.06.140",
    url:
      "https://doi.org/10.1016/j.matpr.2023.06.140",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 15,
    year: "2024",
    title:
      "Application of a Novel Decision-Making Algorithm in Development of a Nylon Hybrid Composite for Manufacture of Plastic Gears",
    journal:
      "Journal of the Institution of Engineers (India): Series D, Volume 105, Pages 745-758",
    indexing: ["Q2-SCOPUS"],
    doi:
      "10.1007/s40033-023-00506-6",
    url:
      "https://doi.org/10.1007/s40033-023-00506-6",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 16,
    year: "2023",
    title:
      "Analysis of tribological and mechanical properties of coated graphene oxide, tungsten disulphide reinforced nylon hybrid composites",
    journal:
      "Multimedia Tools and Applications, April 2023",
    indexing: ["Q1-SCOPUS", "SCIE"],
    doi:
      "10.1007/s11042-023-15218-y",
    url:
      "https://doi.org/10.1007/s11042-023-15218-y",
    proof: "",
    impactFactor: 3.5,
    type: "Journal Article",
  },

  {
    id: 17,
    year: "2021",
    title:
      "Dynamically Adaptive Gain Super Twisting Sliding Mode Control for Extending the range of Hydrogen Fuel Cell based Electric Vehicles",
    journal:
      "Proceedings of CONECCT 2021: 7th IEEE International Conference on Electronics, Computing and Communication Technologies",
    indexing: ["SCOPUS"],
    doi:
      "10.1109/CONECCT52877.2021.9622634",
    url:
      "https://doi.org/10.1109/CONECCT52877.2021.9622634",
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 18,
    year: "2020",
    title:
      "Effect of combined misalignments between the shafts on the contact stress distribution of Plastic Gears",
    journal:
      "International Journal of Advanced Science and Technology, Vol. 29, No. 05, 2020, pp. 10414-10428",
    indexing: ["SCOPUS"],
    url:
      "http://sersc.org/journals/index.php/IJAST/article/view/23635",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 19,
    year: "2020",
    title:
      "Implementation of Covid-19 SARS Detection Method (CSDM) and Extended Simplified SIR Model (ESSM)",
    journal:
      "International Journal of Advanced Science and Technology, Vol. 29, No. 06, 2020, pp. 5075-5002",
    indexing: ["SCOPUS"],
    url:
      "http://sersc.org/journals/index.php/IJAST/article/view/25265",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 20,
    year: "2019",
    title:
      "A Review on Tribological Performance Characteristics of Plastic Gears",
    journal:
      "International Journal of Mechanical Engineering and Technology (IJMET), Vol. 10, Issue 01, January 2019, pp. 516-526",
    indexing: ["SCOPUS"],
    url:
      "https://iaeme.com/Home/article_id/IJMET_10_01_053",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 21,
    year: "2018",
    title:
      "Contact stress analysis of helical gear with variation in Face width and Helix angle by using FEM Technique",
    journal:
      "Mukt Shabd Journal, Vol-IX, Issue IV",
    indexing: ["UGC CARE Group 1"],
    url:
      "https://www.researchgate.net/publication/375826406_CONTACT_STRESS_ANALYSIS_OF_HELICAL_GEAR_WITH_VARIATION_IN_FACE_WIDTH_AND_HELIX_ANGLE_BY_USING_FEM_TECHNIQUE",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 22,
    year: "2018",
    title:
      "Contact Stress Analysis of Involute Spur Gear with varying Centre to Centre Distance",
    journal:
      "IJSDR, Vol. 3, Issue 1, January 2018",
    indexing: [],
    url:
      "https://ijsdr.org/papers/IJSDR1801005.pdf",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 23,
    year: "2018",
    title:
      "Artificial Intelligence Based Pattern Recognition",
    journal:
      "IJA-ERA, Vol. 3, Issue 10, February 2018",
    indexing: [],
    url:
      "https://www.ijaera.org/manuscript/20180310001.pdf",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 24,
    year: "2018",
    title:
      "Contact Stress analysis on Structural Steel Spur gear under misalignment of shafts",
    journal:
      "Springer Conference Proceedings, ICLIET-2018",
    indexing: ["SCOPUS"],
    doi:
      "10.1007/978-981-13-7643-6_23",
    url:
      "https://doi.org/10.1007/978-981-13-7643-6_23",
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 25,
    year: "2018",
    title:
      "Experimental Investigation of Al2O3 and Mustard oil Amalgamation Nano Fluids Effect on Machining Process of En8 Material on Lathe",
    journal:
      "Springer Conference Proceedings, ICLIET-2018",
    indexing: ["SCOPUS"],
    doi:
      "10.1007/978-981-13-7643-6_45",
    url:
      "https://doi.org/10.1007/978-981-13-7643-6_45",
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 26,
    year: "2016",
    title:
      "Vibration and CFD Analysis of Air Craft composite wing in subsonic air flow",
    journal:
      "IARJSET, Vol. 3, Issue 12, December 2016",
    indexing: [],
    url:
      "https://iarjset.com/papers/vibration-and-cfd-analysis-of-air-craft-composite-wing-in-subsonic-air-flow/",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 27,
    year: "2017",
    title:
      "Effect of Cutting Parameters in Drilling of EN8 (080M40) Carbon Steel to Obtain Maximum MRR and Minimum Temperature by Using RSM (Under Dry Condition)",
    journal:
      "IJEMR, Vol. 7, Issue 2, March 2017",
    indexing: [],
    url:
      "https://api.semanticscholar.org/CorpusID:212555252",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 28,
    year: "2016",
    title:
      "Design and Development of Graphene reinforced Acetal copolymer plastic gears and its performance evaluation",
    journal:
      "Materials Today: Proceedings, ICAAMM-2016",
    indexing: ["SCOPUS"],
    doi:
      "10.1016/j.matpr.2017.07.216",
    url:
      "https://doi.org/10.1016/j.matpr.2017.07.216",
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 29,
    year: "2015",
    title:
      "Design and Modelling of Agricultural Sprayer",
    journal:
      "International Journal of Engineering Trends and Technology (IJETT), Volume 23, Number 6, May 2015, pp. 308-316",
    indexing: [],
    url:
      "https://www.academia.edu/116119949/Design_and_Modelling_of_Agricultural_Sprayer",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 30,
    year: "2015",
    title:
      "Finite Element Analysis of Alloy Wheel",
    journal:
      "International Journal of Engineering and Management Research, Volume 5, Issue 2, April 2015, pp. 544-550",
    indexing: [],
    url:
      "https://indianjournals.com/article/ijemr-5-2-100",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 31,
    year: "2015",
    title:
      "Modelling Simulation and Kinematics Calucattions of Stanford Manipulator",
    journal:
      "International Journal of Engineering and Management Research, Volume 5, Issue 2, April 2015, pp. 136-141",
    indexing: [],
    url:
      "https://indianjournals.com/article/ijemr-5-2-027",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 32,
    year: "2015",
    title:
      "Design and Fabrication of Mechatro Hand",
    journal:
      "International Journal of Engineering and Management Research, Volume 5, Issue 3, June 2015, pp. 102-110",
    indexing: [],
    url:
      "https://indianjournals.com/article/ijemr-5-3-020",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 33,
    year: "2014",
    title:
      "Thermo-Structural Finite Element Analysis of I.C. Engine Pistons",
    journal:
      "International Colloquium on Materials, Manufacturing and Metrology, IIT Madras, August 2014, pp. 460-470",
    indexing: [],
    url:
      "https://www.researchgate.net/publication/375826567_Thermo-Structural_Finite_Element_Analysis_of_IC_Engine_Pistons",
    proof: "",
    type: "Conference Proceeding",
  },

  {
    id: 34,
    year: "2014",
    title:
      "Contact Pressure Analysis of Spur gear using FEA",
    journal:
      "International Journal of Advanced Engineering Applications, Vol. 7, Issue 3, pp. 27-41",
    indexing: [],
    url:
      "https://www.researchgate.net/publication/375826443_Contact_pressure_analysis_of_spur_gear_using_FEA",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 35,
    year: "2013",
    title:
      "Multi objective optimization of tool life and total cost using 3-level full factorial method in CNC end milling process",
    journal:
      "International Journal of Engineering and Management Research Review (I.J.E.M.R.R), Volume 2, July 2013",
    indexing: [],
    url:
      "https://www.ijmerr.com/uploadfile/2015/0409/20150409051443966.pdf",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 36,
    year: "2013",
    title:
      "Effect of welding speed on weld quality characteristics of pulsed current micro plasma arc welded AISI 304L Sheets",
    journal:
      "Applied Science and Engineering Progress, 2013/08",
    indexing: [],
    url:
      "https://ph02.tci-thaijo.org/index.php/ijast/article/view/67309",
    proof: "",
    type: "Journal Article",
  },

  {
    id: 37,
    year: "2013",
    title:
      "Selection of optimal lighting conditions for surface texture measurement on inclined machined Surfaces",
    journal:
      "International Journal of Advanced Engineering Applications, Vol. 1, Issue 7, pp. 8-16",
    indexing: [],
    url:
      "https://www.researchgate.net/profile/Phani-Simhadri/publication/375826278_Selection-of-optimal-lighting-conditions-for-surface-texture-measurement-on-inclined-machined-surfaces/links/655e2997b86a1d521b003f20/Selection-of-optimal-lighting-conditions-for-surface-texture-measurement-on-inclined-machined-surfaces.pdf",
    proof: "",
    type: "Journal Article",
  },
];
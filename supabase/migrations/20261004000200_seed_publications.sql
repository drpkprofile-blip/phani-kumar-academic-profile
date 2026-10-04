-- Generated only from committed data/publications.ts by scripts/publication-seed.mjs.
-- Repeatable: no updates/deletes; conflicting existing data aborts the transaction.
begin;
lock table public.publications in exclusive mode;
create temporary table phase2c_expected on commit drop as
select * from jsonb_to_recordset($publication_seed$[
  {
    "id": 1,
    "title": "Machine learning assisted development and finite element based multi-objective optimization of Al6061/WS2/TiO2 hybrid composite spur gears",
    "year": "2026",
    "journal": "International Journal on Interactive Design and Manufacturing (IJIDeM), 2026/08",
    "indexing": [
      "Q2-SCOPUS",
      "ESCI"
    ],
    "doi": "10.1007/s12008-026-02666-7",
    "article_url": "https://doi.org/10.1007/s12008-026-02666-7",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 2.8,
    "source_order": 1,
    "display_order": 1
  },
  {
    "id": 2,
    "title": "AI-Driven Multi-Objective Optimization of Hybrid PA66 Composites Using ML and MPA",
    "year": "2026",
    "journal": "ICANITS 2026, International Conference organized by ANITS",
    "indexing": [
      "SCOPUS"
    ],
    "doi": null,
    "article_url": null,
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 2,
    "display_order": 2
  },
  {
    "id": 3,
    "title": "Machine Learning-Based Optimization and Validation of Hybrid PA66/GO/TiO₂ Nanocomposites for Polymer Gear Applications",
    "year": "2026",
    "journal": "Engineering Research Express, 2026",
    "indexing": [
      "Q2-SCOPUS",
      "ESCI"
    ],
    "doi": "10.1088/2631-8695/ae78a6",
    "article_url": "https://doi.org/10.1088/2631-8695/ae78a6",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 1.6,
    "source_order": 3,
    "display_order": 3
  },
  {
    "id": 4,
    "title": "Experimental Investigation of Contact Stress and Wear Behaviour of Nylon 66/Al2O3/WS2/TiO2 Hybrid Composite Spur Gears",
    "year": "2026",
    "journal": "Journal of the Institution of Engineers (India): Series D, 2026",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s40033-026-01038-5",
    "article_url": "https://doi.org/10.1007/s40033-026-01038-5",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 4,
    "display_order": 4
  },
  {
    "id": 5,
    "title": "An adaptive super-twisting sliding mode control strategy for energy and torque optimisation in hydrogen fuel cell electric vehicles",
    "year": "2026",
    "journal": "International Journal of Mathematical Modelling and Numerical Optimisation, Volume 16, 2026",
    "indexing": [
      "Q3-SCOPUS"
    ],
    "doi": "10.1504/IJMMNO.2026.153032",
    "article_url": "https://doi.org/10.1504/IJMMNO.2026.153032",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 5,
    "display_order": 5
  },
  {
    "id": 6,
    "title": "Simulation and experimental investigation of strain behavior in hybrid reinforced polymer spur gears under misalignment conditions",
    "year": "2026",
    "journal": "International Journal on Interactive Design and Manufacturing (IJIDeM), 2026, Volume 20, Issue 2, Pages 1051-1067",
    "indexing": [
      "Q2-SCOPUS",
      "ESCI"
    ],
    "doi": "10.1007/s12008-025-02450-z",
    "article_url": "https://doi.org/10.1007/s12008-025-02450-z",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 2.5,
    "source_order": 6,
    "display_order": 6
  },
  {
    "id": 7,
    "title": "Optimized control strategies for BLDC motor in sustainable energy systems: enhancing stability and performance through intelligent controllers, filtering techniques and internal model control",
    "year": "2025",
    "journal": "Global Energy Interconnection, Elsevier, 2025",
    "indexing": [
      "Q1-SCOPUS"
    ],
    "doi": "10.1016/j.gloei.2025.09.004",
    "article_url": "https://doi.org/10.1016/j.gloei.2025.09.004",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 3.9,
    "source_order": 7,
    "display_order": 7
  },
  {
    "id": 8,
    "title": "A robust machine learning-based system for battery grading and lifecycle prediction for electric vehicle applications",
    "year": "2025",
    "journal": "International Journal of Information Technology, Springer, 2025, Volume 17, Pages 4767-4777",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s41870-025-02712-9",
    "article_url": "https://doi.org/10.1007/s41870-025-02712-9",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 8,
    "display_order": 8
  },
  {
    "id": 9,
    "title": "Modelling, optimisation, and experimental evaluation of predictive maintenance strategies for LiFePO₄ battery health in e-bikes",
    "year": "2025",
    "journal": "International Journal of Mathematical Modelling and Numerical Optimisation, 2025",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1504/IJMMNO.2026.10073645",
    "article_url": "https://doi.org/10.1504/IJMMNO.2026.10073645",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 9,
    "display_order": 9
  },
  {
    "id": 10,
    "title": "Cyber-physical systems for hybrid braking control techniques in hybrid electric vehicles",
    "year": "2024",
    "journal": "International Journal of Information Technology, Springer Nature Singapore, 2024",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s41870-024-02184-3",
    "article_url": "https://doi.org/10.1007/s41870-024-02184-3",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 10,
    "display_order": 10
  },
  {
    "id": 11,
    "title": "Enhancing HDPE Properties: Impact of Nano-TiO2 and Nano-SiO2 Particles on Mechanical Properties and Wear Resistance",
    "year": "2024",
    "journal": "Journal of the Institution of Engineers (India): Series D, Volume 106, Pages 1603-1617",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s40033-024-00758-w",
    "article_url": "https://doi.org/10.1007/s40033-024-00758-w",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 11,
    "display_order": 11
  },
  {
    "id": 12,
    "title": "A Dual-pronged approach for evaluation of contact stresses in nylon hybrid composite gears under misalignment",
    "year": "2023",
    "journal": "Engineering Research Express, Volume 5, Number 4, 2023",
    "indexing": [
      "Q2-SCOPUS",
      "ESCI"
    ],
    "doi": "10.1088/2631-8695/ad0b61",
    "article_url": "https://doi.org/10.1088/2631-8695/ad0b61",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 1.5,
    "source_order": 12,
    "display_order": 13
  },
  {
    "id": 13,
    "title": "An integrated approach for contact stress analysis of aluminium composite gears through finite element analysis and experimental test rig testing under misalignment",
    "year": "2023",
    "journal": "Journal of the Institution of Engineers (India): Series D, Volume 105, Issue 2, Pages 643-653",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s40033-023-00510-w",
    "article_url": "https://doi.org/10.1007/s40033-023-00510-w",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 13,
    "display_order": 14
  },
  {
    "id": 14,
    "title": "Comparative study on damping performance of different shape memory polymers",
    "year": "2023",
    "journal": "Materials Today: Proceedings, Elsevier, 2023",
    "indexing": [],
    "doi": "10.1016/j.matpr.2023.06.140",
    "article_url": "https://doi.org/10.1016/j.matpr.2023.06.140",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 14,
    "display_order": 15
  },
  {
    "id": 15,
    "title": "Application of a Novel Decision-Making Algorithm in Development of a Nylon Hybrid Composite for Manufacture of Plastic Gears",
    "year": "2024",
    "journal": "Journal of the Institution of Engineers (India): Series D, Volume 105, Pages 745-758",
    "indexing": [
      "Q2-SCOPUS"
    ],
    "doi": "10.1007/s40033-023-00506-6",
    "article_url": "https://doi.org/10.1007/s40033-023-00506-6",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 15,
    "display_order": 12
  },
  {
    "id": 16,
    "title": "Analysis of tribological and mechanical properties of coated graphene oxide, tungsten disulphide reinforced nylon hybrid composites",
    "year": "2023",
    "journal": "Multimedia Tools and Applications, April 2023",
    "indexing": [
      "Q1-SCOPUS",
      "SCIE"
    ],
    "doi": "10.1007/s11042-023-15218-y",
    "article_url": "https://doi.org/10.1007/s11042-023-15218-y",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": 3.5,
    "source_order": 16,
    "display_order": 16
  },
  {
    "id": 17,
    "title": "Dynamically Adaptive Gain Super Twisting Sliding Mode Control for Extending the range of Hydrogen Fuel Cell based Electric Vehicles",
    "year": "2021",
    "journal": "Proceedings of CONECCT 2021: 7th IEEE International Conference on Electronics, Computing and Communication Technologies",
    "indexing": [
      "SCOPUS"
    ],
    "doi": "10.1109/CONECCT52877.2021.9622634",
    "article_url": "https://doi.org/10.1109/CONECCT52877.2021.9622634",
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 17,
    "display_order": 17
  },
  {
    "id": 18,
    "title": "Effect of combined misalignments between the shafts on the contact stress distribution of Plastic Gears",
    "year": "2020",
    "journal": "International Journal of Advanced Science and Technology, Vol. 29, No. 05, 2020, pp. 10414-10428",
    "indexing": [
      "SCOPUS"
    ],
    "doi": null,
    "article_url": "http://sersc.org/journals/index.php/IJAST/article/view/23635",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 18,
    "display_order": 18
  },
  {
    "id": 19,
    "title": "Implementation of Covid-19 SARS Detection Method (CSDM) and Extended Simplified SIR Model (ESSM)",
    "year": "2020",
    "journal": "International Journal of Advanced Science and Technology, Vol. 29, No. 06, 2020, pp. 5075-5002",
    "indexing": [
      "SCOPUS"
    ],
    "doi": null,
    "article_url": "http://sersc.org/journals/index.php/IJAST/article/view/25265",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 19,
    "display_order": 19
  },
  {
    "id": 20,
    "title": "A Review on Tribological Performance Characteristics of Plastic Gears",
    "year": "2019",
    "journal": "International Journal of Mechanical Engineering and Technology (IJMET), Vol. 10, Issue 01, January 2019, pp. 516-526",
    "indexing": [
      "SCOPUS"
    ],
    "doi": null,
    "article_url": "https://iaeme.com/Home/article_id/IJMET_10_01_053",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 20,
    "display_order": 20
  },
  {
    "id": 21,
    "title": "Contact stress analysis of helical gear with variation in Face width and Helix angle by using FEM Technique",
    "year": "2018",
    "journal": "Mukt Shabd Journal, Vol-IX, Issue IV",
    "indexing": [
      "UGC CARE Group 1"
    ],
    "doi": null,
    "article_url": "https://www.researchgate.net/publication/375826406_CONTACT_STRESS_ANALYSIS_OF_HELICAL_GEAR_WITH_VARIATION_IN_FACE_WIDTH_AND_HELIX_ANGLE_BY_USING_FEM_TECHNIQUE",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 21,
    "display_order": 21
  },
  {
    "id": 22,
    "title": "Contact Stress Analysis of Involute Spur Gear with varying Centre to Centre Distance",
    "year": "2018",
    "journal": "IJSDR, Vol. 3, Issue 1, January 2018",
    "indexing": [],
    "doi": null,
    "article_url": "https://ijsdr.org/papers/IJSDR1801005.pdf",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 22,
    "display_order": 22
  },
  {
    "id": 23,
    "title": "Artificial Intelligence Based Pattern Recognition",
    "year": "2018",
    "journal": "IJA-ERA, Vol. 3, Issue 10, February 2018",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.ijaera.org/manuscript/20180310001.pdf",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 23,
    "display_order": 23
  },
  {
    "id": 24,
    "title": "Contact Stress analysis on Structural Steel Spur gear under misalignment of shafts",
    "year": "2018",
    "journal": "Springer Conference Proceedings, ICLIET-2018",
    "indexing": [
      "SCOPUS"
    ],
    "doi": "10.1007/978-981-13-7643-6_23",
    "article_url": "https://doi.org/10.1007/978-981-13-7643-6_23",
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 24,
    "display_order": 24
  },
  {
    "id": 25,
    "title": "Experimental Investigation of Al2O3 and Mustard oil Amalgamation Nano Fluids Effect on Machining Process of En8 Material on Lathe",
    "year": "2018",
    "journal": "Springer Conference Proceedings, ICLIET-2018",
    "indexing": [
      "SCOPUS"
    ],
    "doi": "10.1007/978-981-13-7643-6_45",
    "article_url": "https://doi.org/10.1007/978-981-13-7643-6_45",
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 25,
    "display_order": 25
  },
  {
    "id": 26,
    "title": "Vibration and CFD Analysis of Air Craft composite wing in subsonic air flow",
    "year": "2016",
    "journal": "IARJSET, Vol. 3, Issue 12, December 2016",
    "indexing": [],
    "doi": null,
    "article_url": "https://iarjset.com/papers/vibration-and-cfd-analysis-of-air-craft-composite-wing-in-subsonic-air-flow/",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 26,
    "display_order": 27
  },
  {
    "id": 27,
    "title": "Effect of Cutting Parameters in Drilling of EN8 (080M40) Carbon Steel to Obtain Maximum MRR and Minimum Temperature by Using RSM (Under Dry Condition)",
    "year": "2017",
    "journal": "IJEMR, Vol. 7, Issue 2, March 2017",
    "indexing": [],
    "doi": null,
    "article_url": "https://api.semanticscholar.org/CorpusID:212555252",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 27,
    "display_order": 26
  },
  {
    "id": 28,
    "title": "Design and Development of Graphene reinforced Acetal copolymer plastic gears and its performance evaluation",
    "year": "2016",
    "journal": "Materials Today: Proceedings, ICAAMM-2016",
    "indexing": [
      "SCOPUS"
    ],
    "doi": "10.1016/j.matpr.2017.07.216",
    "article_url": "https://doi.org/10.1016/j.matpr.2017.07.216",
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 28,
    "display_order": 28
  },
  {
    "id": 29,
    "title": "Design and Modelling of Agricultural Sprayer",
    "year": "2015",
    "journal": "International Journal of Engineering Trends and Technology (IJETT), Volume 23, Number 6, May 2015, pp. 308-316",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.academia.edu/116119949/Design_and_Modelling_of_Agricultural_Sprayer",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 29,
    "display_order": 29
  },
  {
    "id": 30,
    "title": "Finite Element Analysis of Alloy Wheel",
    "year": "2015",
    "journal": "International Journal of Engineering and Management Research, Volume 5, Issue 2, April 2015, pp. 544-550",
    "indexing": [],
    "doi": null,
    "article_url": "https://indianjournals.com/article/ijemr-5-2-100",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 30,
    "display_order": 30
  },
  {
    "id": 31,
    "title": "Modelling Simulation and Kinematics Calucattions of Stanford Manipulator",
    "year": "2015",
    "journal": "International Journal of Engineering and Management Research, Volume 5, Issue 2, April 2015, pp. 136-141",
    "indexing": [],
    "doi": null,
    "article_url": "https://indianjournals.com/article/ijemr-5-2-027",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 31,
    "display_order": 31
  },
  {
    "id": 32,
    "title": "Design and Fabrication of Mechatro Hand",
    "year": "2015",
    "journal": "International Journal of Engineering and Management Research, Volume 5, Issue 3, June 2015, pp. 102-110",
    "indexing": [],
    "doi": null,
    "article_url": "https://indianjournals.com/article/ijemr-5-3-020",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 32,
    "display_order": 32
  },
  {
    "id": 33,
    "title": "Thermo-Structural Finite Element Analysis of I.C. Engine Pistons",
    "year": "2014",
    "journal": "International Colloquium on Materials, Manufacturing and Metrology, IIT Madras, August 2014, pp. 460-470",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.researchgate.net/publication/375826567_Thermo-Structural_Finite_Element_Analysis_of_IC_Engine_Pistons",
    "proof_url": null,
    "publication_type": "Conference Proceeding",
    "impact_factor": null,
    "source_order": 33,
    "display_order": 33
  },
  {
    "id": 34,
    "title": "Contact Pressure Analysis of Spur gear using FEA",
    "year": "2014",
    "journal": "International Journal of Advanced Engineering Applications, Vol. 7, Issue 3, pp. 27-41",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.researchgate.net/publication/375826443_Contact_pressure_analysis_of_spur_gear_using_FEA",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 34,
    "display_order": 34
  },
  {
    "id": 35,
    "title": "Multi objective optimization of tool life and total cost using 3-level full factorial method in CNC end milling process",
    "year": "2013",
    "journal": "International Journal of Engineering and Management Research Review (I.J.E.M.R.R), Volume 2, July 2013",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.ijmerr.com/uploadfile/2015/0409/20150409051443966.pdf",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 35,
    "display_order": 35
  },
  {
    "id": 36,
    "title": "Effect of welding speed on weld quality characteristics of pulsed current micro plasma arc welded AISI 304L Sheets",
    "year": "2013",
    "journal": "Applied Science and Engineering Progress, 2013/08",
    "indexing": [],
    "doi": null,
    "article_url": "https://ph02.tci-thaijo.org/index.php/ijast/article/view/67309",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 36,
    "display_order": 36
  },
  {
    "id": 37,
    "title": "Selection of optimal lighting conditions for surface texture measurement on inclined machined Surfaces",
    "year": "2013",
    "journal": "International Journal of Advanced Engineering Applications, Vol. 1, Issue 7, pp. 8-16",
    "indexing": [],
    "doi": null,
    "article_url": "https://www.researchgate.net/profile/Phani-Simhadri/publication/375826278_Selection-of-optimal-lighting-conditions-for-surface-texture-measurement-on-inclined-machined-surfaces/links/655e2997b86a1d521b003f20/Selection-of-optimal-lighting-conditions-for-surface-texture-measurement-on-inclined-machined-surfaces.pdf",
    "proof_url": null,
    "publication_type": "Journal Article",
    "impact_factor": null,
    "source_order": 37,
    "display_order": 37
  }
]$publication_seed$::jsonb)
as p(id integer, title text, year text, journal text, indexing text[], doi text,
article_url text, proof_url text, publication_type text, impact_factor numeric,
source_order integer, display_order integer);

do $$
begin
  if not exists (select 1 from public.publication_settings where id = true and hero_publications = '40+') then
    raise exception 'Independent hero counter must already be 40+';
  end if;
  if exists (
    select 1 from public.publications p left join phase2c_expected e using (id)
    where e.id is null or (to_jsonb(p) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Existing publications conflict with the static source; no records changed';
  end if;
end;
$$;

insert into public.publications
(id,title,year,journal,indexing,doi,article_url,proof_url,publication_type,impact_factor,source_order,display_order)
select e.* from phase2c_expected e
where not exists (select 1 from public.publications p where p.id = e.id);

do $$
begin
  if (select count(*) from public.publications) <> 37 or exists (
    select 1 from phase2c_expected e left join public.publications p using(id)
    where (to_jsonb(p) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Field-by-field seed verification failed';
  end if;
end;
$$;
-- Never rewind a sequence that may already have issued IDs.
select setval('public.publications_id_seq', greatest(
  (select max(id) from public.publications),
  (select last_value from public.publications_id_seq)
), true);
commit;

FINAL WEBSITE FILE SET
========================

Replace the corresponding files in your project:

app/page.tsx
app/layout.tsx
app/globals.css
data/activities.ts
data/certifications.ts
data/profile.ts
data/publications.ts

Important:
1. Keep your profile image in the project's public folder.
2. The code tries /phani-photo.png first and falls back to /phani photo.png.
3. Publication article links use the existing URL/DOI data.
4. Publication PDF Proof uses publication.pdfUrl or publication.proof.
5. The current resume supplied to the project contains article URLs, but it does not contain Google Drive PDF links for the 37 publications. Therefore the UI shows "PDF Proof will be updated soon" until an actual Drive URL is entered. No fake Drive URLs were invented.
6. Existing real Drive links from the resume are preserved for education, certifications and achievements.
7. Added the missing 2020 "Additive Manufacturing & 3D Printing" STTP from the resume.
8. Impact factors are shown only for publications where the supplied resume explicitly provides one.

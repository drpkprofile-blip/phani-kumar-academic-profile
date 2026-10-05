export const activityFields = ["year","title","activity_type","institution","date_text","duration_text","details","proof_url"] as const;
export type ActivityField = typeof activityFields[number];
export type ActivityValues = Record<ActivityField,string>;
export type ActivityFormState = {message?:string; errors?:Partial<Record<ActivityField,string>>; values?:ActivityValues};
export function parseActivityForm(form:FormData, categories:string[]) {
  const values=Object.fromEntries(activityFields.map(field=>[field,typeof form.get(field)==="string"?form.get(field):""])) as ActivityValues;
  const errors:ActivityFormState["errors"]={};
  for(const field of ["year","title","activity_type","institution"] as const) if(!values[field].trim()) errors[field]="This field is required.";
  if(!/^\d{4}$/.test(values.year)) errors.year="Enter a four-digit year.";
  if(!categories.includes(values.activity_type)) errors.activity_type="Choose an existing activity category.";
  const optional=(value:string)=>value.trim()?value:null;
  if(optional(values.proof_url)) {
    try {const url=new URL(values.proof_url);if(!/^https?:\/\//i.test(values.proof_url)||url.username||url.password) throw new Error();}
    catch {errors.proof_url="Enter an HTTP or HTTPS URL without credentials.";}
  }
  return {values,errors,data:{year:values.year,title:values.title,activity_type:values.activity_type,institution:values.institution,
    date_text:optional(values.date_text),duration_text:optional(values.duration_text),details:optional(values.details),proof_url:optional(values.proof_url)}};
}

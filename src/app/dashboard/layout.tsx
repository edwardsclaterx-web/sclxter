import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { DashHeader } from "./dash-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-full flex-col">
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{var p=Performance.prototype;if(p.__sclxterMeasure)return;var o=p.measure.bind(p);p.measure=function(){try{return o.apply(this,arguments)}catch(e){if(e&&e.name==='TypeError')return}throw e};p.__sclxterMeasure=1}catch(e){}})();",
        }}
      />
      <DashHeader email={user.email} admin={isAdmin(user)} />
      {children}
    </div>
  );
}

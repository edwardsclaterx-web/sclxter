export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="widget-frame h-dvh overflow-visible bg-transparent">
      <style
        dangerouslySetInnerHTML={{
          __html:
            "html,body{background:transparent!important;color:inherit}",
        }}
      />
      {children}
    </div>
  );
}

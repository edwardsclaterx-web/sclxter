export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="widget-frame h-dvh overflow-visible bg-transparent">
      {children}
    </div>
  );
}

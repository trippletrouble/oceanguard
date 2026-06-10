export default function LandingInfoBox() {
  return (
    <section className="w-full flex justify-center">
      <div className="glass-card rounded-4xl flex flex-col w-[60%] gap-8 p-12">
        <h3 className="text-4xl max-w-xl">
          Ocean Guard integrates 3 APIs to transform data into knowledge
        </h3>
        <p className="text-2xl max-w-lg">
          We integrate these global data sources to calculate real-time threat
          levels, identifying high-risk fishing activity the moment it enters
          protected waters.
        </p>
      </div>
    </section>
  );
}

const SERVER = "http://localhost:8080";

export default function StoryPage() {
  return (
    <section
      className="w-full h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('${SERVER}/images/route.png')`,
      }}
    >
    </section>
  );
}
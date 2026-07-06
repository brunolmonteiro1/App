import Hero from "@/components/home/Hero";
import ProblemaInvisivel from "@/components/home/ProblemaInvisivel";
import NossaResposta from "@/components/home/NossaResposta";
import JornadaVoar from "@/components/home/JornadaVoar";
import TurmasReduzidas from "@/components/home/TurmasReduzidas";
import Pilares from "@/components/home/Pilares";
import Sustentabilidade from "@/components/home/Sustentabilidade";
import Timeline from "@/components/home/Timeline";
import ComoApoiar from "@/components/home/ComoApoiar";
import CtaFinal from "@/components/home/CtaFinal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemaInvisivel />
      <NossaResposta />
      <JornadaVoar />
      <TurmasReduzidas />
      <Pilares />
      <Sustentabilidade />
      <Timeline />
      <ComoApoiar />
      <CtaFinal />
    </>
  );
}

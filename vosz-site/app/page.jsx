import Hero from "@/components/home/Hero";
import ProblemaInvisivel from "@/components/home/ProblemaInvisivel";
import NossaResposta from "@/components/home/NossaResposta";
import JornadaBeneficiario from "@/components/home/JornadaBeneficiario";
import Pilares from "@/components/home/Pilares";
import Sustentabilidade from "@/components/home/Sustentabilidade";
import ImpactoConfianca from "@/components/home/ImpactoConfianca";
import ComoApoiar from "@/components/home/ComoApoiar";
import CtaFinal from "@/components/home/CtaFinal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactoConfianca />
      <ProblemaInvisivel />
      <NossaResposta />
      <JornadaBeneficiario numero="02" />
      <Pilares />
      <Sustentabilidade />
      <ComoApoiar />
      <CtaFinal />
    </>
  );
}

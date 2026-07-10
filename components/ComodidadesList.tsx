import {
  Blinds,
  Dumbbell,
  Fence,
  Flame,
  Landmark,
  Laptop,
  MoveVertical,
  PartyPopper,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Sofa,
  Sun,
  SunMedium,
  ToyBrick,
  Trees,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { COMODIDADE_LABEL } from "@/lib/comodidades";

const ICONES: Record<string, LucideIcon> = {
  piscina: Waves,
  churrasqueira: Flame,
  "area-gourmet": UtensilsCrossed,
  academia: Dumbbell,
  "salao-festas": PartyPopper,
  playground: ToyBrick,
  "portaria-24h": ShieldCheck,
  "condominio-fechado": Fence,
  elevador: MoveVertical,
  mobiliado: Sofa,
  "ar-condicionado": Snowflake,
  "aquecimento-solar": SunMedium,
  "energia-solar": Sun,
  quintal: Trees,
  varanda: Blinds,
  escritorio: Laptop,
  lavanderia: WashingMachine,
  "pet-friendly": PawPrint,
};

/** Badges de comodidades na página do imóvel. */
export default function ComodidadesList({ valores }: { valores: string[] }) {
  if (valores.length === 0) return null;

  return (
    <section aria-labelledby="comodidades-titulo">
      <h2
        id="comodidades-titulo"
        className="mb-3 text-lg font-normal tracking-tight"
      >
        Comodidades
      </h2>
      <ul className="flex flex-wrap gap-2">
        {valores.map((valor) => {
          const rotulo = COMODIDADE_LABEL[valor];
          if (!rotulo) return null;
          const Icone = ICONES[valor] ?? Landmark;
          return (
            <li
              key={valor}
              className="flex items-center gap-2 rounded-pill border border-black/10 bg-white px-3.5 py-2 text-[12px] font-medium text-black/75"
            >
              <Icone size={14} strokeWidth={1.75} aria-hidden="true" />
              {rotulo}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

<script setup>
/* Mapea nombres semánticos de la vista de perfil a íconos de lucide-vue-next. */
import { computed } from 'vue'
import {
  LayoutGrid,
  User,
  ShieldCheck,
  Settings,
  Mail,
  BadgeCheck,
  CalendarDays,
  CircleCheck,
  CircleAlert,
  Activity,
  LayoutDashboard,
  LogOut,
  Leaf,
  Map,
  BookOpen,
  PenLine,
  Lock,
  Trash2,
  ArrowRight,
  Check,
} from 'lucide-vue-next'

const props = defineProps({
  nombre: { type: String, required: true },
  tamano: { type: [Number, String], default: 18 },
})

const ICONOS = {
  resumen: LayoutGrid,
  usuario: User,
  escudo: ShieldCheck,
  engrane: Settings,
  correo: Mail,
  insignia: BadgeCheck,
  calendario: CalendarDays,
  check: CircleCheck,
  alerta: CircleAlert,
  actividad: Activity,
  panel: LayoutDashboard,
  salir: LogOut,
  hoja: Leaf,
  mapa: Map,
  libro: BookOpen,
  lapiz: PenLine,
  candado: Lock,
  basura: Trash2,
  flecha: ArrowRight,
  palomita: Check,
}

const componente = computed(() => ICONOS[props.nombre] || CircleAlert)
</script>

<template>
  <component :is="componente" :size="Number(tamano)" :stroke-width="2" aria-hidden="true" focusable="false" />
</template>

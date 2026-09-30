<script setup>
/**
 * Ícono SVG del sitio (lucide-vue-next). Regla del proyecto: NO usar emojis.
 * - nombre: clave semántica de ICONOS (abajo).
 * - tamano: tamaño en px (default 18).
 * Hereda el color del texto (currentColor).
 */
import { computed } from 'vue'
import {
  TreePalm, Sun, SunDim, CloudSun, CloudMoon, Snowflake, Leaf, Sprout, Droplet, Droplets, MapPin,
  Moon, Cloud, Cloudy, CloudRain, CloudDrizzle, CloudLightning, CloudFog, Thermometer, Wind,
  Mail, Check, X, Info, CircleCheck, CircleAlert, CircleX, User, LayoutDashboard, LogOut, Search,
  Newspaper, Clapperboard, Star, CalendarDays, PenLine, Pencil, Trash2, BookOpen, Library,
  FileText, Image, ImageOff, House, Compass, Scale, Eye, Pause, Play, Link, TriangleAlert,
  Lightbulb, Sparkles, Earth, Flower2, SearchX, Plus, ChevronRight, ChevronLeft, Bookmark, Map as MapIcon, ChevronUp, ChevronDown,
  Lock, Heart, Flower, TreeDeciduous
} from 'lucide-vue-next'

const ICONOS = {
  // Clima / plantas
  tropical: TreePalm, arido: Sun, templado: CloudSun, frio: Snowflake,
  sol: Sun, solTenue: SunDim, sombraParcial: CloudSun, sombra: Cloudy,
  hoja: Leaf, brote: Sprout, flor: Flower2, gota: Droplet, humedad: Droplets,
  ubicacion: MapPin, tierra: Earth, temperatura: Thermometer, viento: Wind,
  luna: Moon, nube: Cloud, nubes: Cloudy, nubeLuna: CloudMoon, lluvia: CloudRain,
  llovizna: CloudDrizzle, tormenta: CloudLightning, nieve: Snowflake, niebla: CloudFog,
  // Interfaz
  correo: Mail, check: Check, cerrar: X, info: Info, exito: CircleCheck, alerta: CircleAlert,
  error: CircleX, advertencia: TriangleAlert, usuario: User, panel: LayoutDashboard,
  salir: LogOut, buscar: Search, sinResultados: SearchX, noticia: Newspaper, video: Clapperboard,
  estrella: Star, calendario: CalendarDays, escribir: PenLine, editar: Pencil, eliminar: Trash2,
  libro: BookOpen, biblioteca: Library, documento: FileText, imagen: Image, sinImagen: ImageOff,
  inicio: House, brujula: Compass, legal: Scale, ver: Eye, pausa: Pause, play: Play,
  enlace: Link, idea: Lightbulb, destello: Sparkles,
  agregar: Plus, chevronDerecha: ChevronRight, chevronIzquierda: ChevronLeft,
  marcador: Bookmark, mapa: MapIcon, subir: ChevronUp, bajar: ChevronDown,
  // Insignias
  candado: Lock,
  // Insignias de racha y fechas
  corazon: Heart, nochebuena: Flower, jacaranda: TreeDeciduous
}

const props = defineProps({
  nombre: { type: String, required: true },
  tamano: { type: [Number, String], default: 18 },
  grosor: { type: [Number, String], default: 2 }
})

const componente = computed(() => ICONOS[props.nombre] || Leaf)
</script>

<template>
  <component
    :is="componente"
    class="icono"
    :size="Number(tamano)"
    :stroke-width="Number(grosor)"
    aria-hidden="true"
    focusable="false"
  />
</template>

<style scoped>
.icono { flex-shrink: 0; display: inline-block; vertical-align: -0.15em; }
</style>

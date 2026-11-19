import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MousePointerClick } from 'lucide-react'
import Brand from '../components/layout/Brand.jsx'
import ThemeToggle from '../components/layout/ThemeToggle.jsx'
import Glass from '../components/ui/Glass.jsx'
import Button from '../components/ui/Button.jsx'
import Reveal, { revealItem } from '../components/ui/Reveal.jsx'
import RouteLine from '../components/transit-ui/RouteLine.jsx'
import Arrivals from '../components/transit-ui/Arrivals.jsx'
import { useStations, useVehicles } from '../hooks/useTransit.js'

const STEPS = [
  { title: 'Crea tu cuenta', text: 'Recibes una tarjeta TuLlave virtual. Recárgala en segundos.' },
  { title: 'Elige a dónde vas', text: 'Te decimos si conviene el expreso o el corriente y cuánto tardas.' },
  { title: 'Paga y sigue tu bus', text: 'Ves cuándo llega, dónde va y te avisamos antes de tu parada.' },
]

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } }

function Landing() {
  const { stations } = useStations()
  const { vehicles } = useVehicles()
  const calle26 = stations.find((s) => s.code === 'calle-26')

  return (
    <div className="landing">
      <motion.header className="landing-nav" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Brand />
        <div className="row">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost">Ingresar</Button>
          </Link>
          <Link to="/registro">
            <Button>Crear cuenta</Button>
          </Link>
        </div>
      </motion.header>

      <section className="hero">
        <Reveal>
          <Reveal.Item>
            <span className="eyebrow">Troncal Caracas · en vivo</span>
          </Reveal.Item>
          <Reveal.Item as="h1" className="title-xl" style={{ marginTop: 18 }}>
            TransMilenio,
            <br />
            <em>a tu ritmo.</em>
          </Reveal.Item>
          <Reveal.Item as="p">
            Sigue los buses en tiempo real, conoce cuándo llega el próximo y paga tu viaje con tu tarjeta TuLlave.
          </Reveal.Item>
          <Reveal.Item className="row wrap">
            <Link to="/registro">
              <Button size="lg">
                Empezar ahora <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="glass">
                Ya tengo cuenta
              </Button>
            </Link>
          </Reveal.Item>
          <Reveal.Item className="hero-hint">
            <MousePointerClick size={15} />
            <span className="desktop-only">Pasa el mouse por el fondo: detrás del vidrio está Bogotá.</span>
            <span className="mobile-only">Toca el fondo para ver Bogotá.</span>
          </Reveal.Item>
        </Reveal>

        <Glass strong tilt variants={revealItem} initial="hidden" animate="show">
          <div className="card-head">
            <h3 className="title-md">
              <span className="live-dot" /> En vivo ahora
            </h3>
            <span className="chip">{vehicles.length} buses</span>
          </div>
          <RouteLine stations={stations} vehicles={vehicles} compact />
          <div className="legend" style={{ marginTop: 6 }}>
            <span>
              <i className="red" /> Expreso B75
            </span>
            <span>
              <i /> Corriente C15
            </span>
            <span>
              <i className="dot" /> Parada expreso
            </span>
          </div>
        </Glass>
      </section>

      <section className="how" aria-labelledby="how-title">
        <motion.h2 id="how-title" className="title-lg" variants={revealItem} {...inView}>
          Cómo funciona
        </motion.h2>
        <Reveal className="steps-grid" {...inView} animate={undefined}>
          {STEPS.map((s, i) => (
            <Glass key={s.title} className="step" variants={revealItem}>
              <span className="step-n mono">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Glass>
          ))}
        </Reveal>
      </section>

      <section className="preview">
        <motion.div variants={revealItem} {...inView}>
          <span className="eyebrow">Así se ve por dentro</span>
          <h2 className="title-lg" style={{ marginTop: 12 }}>
            Sabes cuándo salir,
            <br />
            no solo cuándo llega.
          </h2>
          <p className="muted" style={{ maxWidth: 420 }}>
            Estas son las llegadas reales de la simulación en Calle 26, en este momento. Con tu cuenta las ves para tus
            estaciones favoritas.
          </p>
        </motion.div>
        <Glass strong variants={revealItem} {...inView}>
          <div className="card-head">
            <h3 className="title-md">Próximas llegadas</h3>
            <span className="chip">Calle 26</span>
          </div>
          {calle26 ? <Arrivals stationId={calle26.id} limit={3} /> : <p className="empty">Cargando…</p>}
        </Glass>
      </section>

      <footer className="landing-foot">
        <span>Milenew · proyecto académico</span>
        <span>La ubicación de los buses es simulada.</span>
      </footer>
    </div>
  )
}

export default Landing

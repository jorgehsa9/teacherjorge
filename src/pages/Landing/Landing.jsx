import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Star, Target, Users, Calendar, ArrowRight, MonitorPlay } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './Landing.css';

const Landing = () => {
  const { scrollYProgress, scrollY } = useScroll();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Hero section parallax & fade (using pixels for precise hero tracking)
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroImageY = useTransform(scrollY, [0, 500], [0, -150]); // Parallax moving up faster

  // Background Orbs parallax (using progress for whole page)
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  useEffect(() => {
    document.body.style.backgroundColor = '#030014';
    return () => {
      document.body.style.backgroundColor = '';
    }
  }, []);

  // Standard stagger settings
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <div className="bg-orbs">
        <motion.div style={{ y: orb1Y }} className="orb orb-1"></motion.div>
        <motion.div style={{ y: orb2Y }} className="orb orb-2"></motion.div>
        <motion.div style={{ y: orb3Y }} className="orb orb-3"></motion.div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="landing-nav"
      >
        <Link to="/" className="landing-nav-logo">
          <BookOpen className="text-primary" size={28} />
          Teacher Jorge
        </Link>
        <div className="landing-nav-actions">
          <a href="https://www.youtube.com/@teacherjorgetoday" target="_blank" rel="noopener noreferrer" className="landing-nav-icon" title="YouTube Channel">
            <MonitorPlay size={24} />
          </a>
          <a href="https://book-8uu.pages.dev" target="_blank" rel="noopener noreferrer" className="landing-nav-icon" title="Meu Livro de Inglês">
            <BookOpen size={24} />
          </a>
          <Link to="/login" className="landing-nav-btn">
            Portal do Aluno
          </Link>
        </div>
      </motion.nav>

      <div className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div style={{ opacity: heroOpacity, y: heroY }} className="hero-content">
            <motion.span 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
              className="hero-tag"
            >
              Inteligência & Personalização
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
              className="hero-title"
            >
              Domine o Inglês no Seu Ritmo.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="hero-subtitle"
            >
              Aulas desenhadas milimetricamente para os seus objetivos. Ganhe fluência real, 
              prepare-se para exames e desbloqueie o mundo.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
              <Link to="/plans" className="hero-cta">
                Escolher Plano
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            style={{ y: heroImageY }}
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3, duration: 1 }}
            className="hero-image-wrapper"
          >
            <img src="/teacher_jorge.jpg" alt="Teacher Jorge" className="hero-image" style={{ objectFit: 'cover' }} />
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <motion.h2 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
            className="section-title"
          >
            O Futuro do Seu Aprendizado
          </motion.h2>
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
            className="features-grid"
          >
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="feature-icon">
                <Target size={32} />
              </div>
              <h3 className="feature-title">Precisão Cirúrgica</h3>
              <p className="feature-desc">
                Não perca tempo com genéricos. Cada módulo é adaptado para o seu momento de vida, seja Business, Viagens ou Certificações Internacionais.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="feature-icon">
                <Calendar size={32} />
              </div>
              <h3 className="feature-title">Controle Absoluto</h3>
              <p className="feature-desc">
                Sua agenda, suas regras. Cancele, remarque ou adicione aulas em uma plataforma ultra-responsiva e sem burocracias.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3 className="feature-title">Ecossistema Completo</h3>
              <p className="feature-desc">
                Receba feedback instantâneo, acesse o histórico de evolução e mantenha o foco total na fluência com ferramentas premium.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Ecosystem Section */}
        <section className="ecosystem-section">
          <motion.h2 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
            className="section-title"
          >
            Além das Aulas: O Ecossistema
          </motion.h2>
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
            className="ecosystem-grid features-grid"
          >
            <motion.a 
              href="https://book-8uu.pages.dev" target="_blank" rel="noopener noreferrer"
              variants={fadeInUp} className="hyper-glass-card ecosystem-card"
            >
              <div className="feature-icon">
                <BookOpen size={32} />
              </div>
              <h3 className="feature-title">Meu Livro de Inglês</h3>
              <p className="feature-desc">
                Acesse gratuitamente lições completas de gramática, exercícios, minigames e simulados interativos em nosso portal de estudos aberto.
              </p>
              <div className="ecosystem-cta">Acessar o Livro <ArrowRight size={16} /></div>
            </motion.a>

            <motion.a 
              href="https://www.youtube.com/@teacherjorgetoday" target="_blank" rel="noopener noreferrer"
              variants={fadeInUp} className="hyper-glass-card ecosystem-card"
            >
              <div className="feature-icon" style={{ color: '#ff0000' }}>
                <MonitorPlay size={32} />
              </div>
              <h3 className="feature-title">Teacher Jorge Today</h3>
              <p className="feature-desc">
                Dicas rápidas, pronúncia e cultura. Inscreva-se para consumir conteúdo diário de alto impacto e manter o inglês sempre ativo.
              </p>
              <div className="ecosystem-cta">Inscrever-se no Canal <ArrowRight size={16} /></div>
            </motion.a>
          </motion.div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section">
          <motion.h2 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
            className="section-title"
          >
            Aprovado por Líderes
          </motion.h2>
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
            className="reviews-grid"
          >
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="review-stars">
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
              </div>
              <p className="review-quote">
                "A experiência é de outro nível. O material é focado no que eu realmente preciso para o mundo corporativo."
              </p>
              <div className="review-author">
                <div className="review-avatar">M</div>
                <div>
                  <span className="review-name">Mariana S.</span>
                  <span className="review-role">Head of Product</span>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="review-stars">
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
              </div>
              <p className="review-quote">
                "A plataforma do aluno me permite acompanhar meu progresso e faturas de forma totalmente transparente e linda."
              </p>
              <div className="review-author">
                <div className="review-avatar">R</div>
                <div>
                  <span className="review-name">Rafael C.</span>
                  <span className="review-role">Software Engineer</span>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="hyper-glass-card">
              <div className="review-stars">
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
                <Star fill="currentColor" size={20} />
              </div>
              <p className="review-quote">
                "Nunca vi uma organização financeira e educacional tão impecável. Isso reflete diretamente na qualidade da aula."
              </p>
              <div className="review-author">
                <div className="review-avatar">F</div>
                <div>
                  <span className="review-name">Fernanda L.</span>
                  <span className="review-role">CFO</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Call to Action Section */}
        <motion.section 
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
          className="cta-section"
        >
          <motion.h2 variants={fadeInUp} className="cta-title">Eleve o Nível do seu Inglês.</motion.h2>
          <motion.p variants={fadeInUp} className="cta-subtitle">
            Junte-se à elite de alunos que aceleraram suas carreiras e vivências através de uma metodologia de alto impacto.
          </motion.p>
          <motion.div variants={fadeInUp} className="cta-buttons">
            <Link to="/plans" className="hero-cta">
              Ver Planos e Valores
              <ArrowRight size={20} />
            </Link>
            <a href="mailto:contato@teacherjorge.com" className="cta-outline-btn">
              Falar com o Professor
            </a>
          </motion.div>
        </motion.section>
        
        <motion.footer 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} viewport={{ once: true }}
          className="landing-footer"
        >
          <p>&copy; {new Date().getFullYear()} Teacher Jorge. Aulas de Alto Desempenho.</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Landing;

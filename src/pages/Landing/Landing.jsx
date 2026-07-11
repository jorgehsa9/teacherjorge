import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Target, Users, Calendar, ArrowRight } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  useEffect(() => {
    // Adiciona uma classe ao body caso precise, mas o CSS já cuida de tudo
    document.body.style.backgroundColor = '#030014';
    return () => {
      document.body.style.backgroundColor = '';
    }
  }, []);

  return (
    <div className="landing-page">
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav animate-in">
        <Link to="/" className="landing-nav-logo">
          <BookOpen className="text-primary" size={28} />
          Teacher Jorge
        </Link>
        <Link to="/login" className="landing-nav-btn">
          Portal do Aluno
        </Link>
      </nav>

      <div className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-tag animate-in delay-100">Inteligência & Personalização</span>
            <h1 className="hero-title animate-in delay-200">Domine o Inglês no Seu Ritmo.</h1>
            <p className="hero-subtitle animate-in delay-300">
              Aulas desenhadas milimetricamente para os seus objetivos. Ganhe fluência real, 
              prepare-se para exames e desbloqueie o mundo.
            </p>
            <div className="animate-in delay-400">
              <Link to="/login" className="hero-cta">
                Começar Jornada
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
          <div className="hero-image-wrapper animate-in delay-300">
            <img src="/landing_hero.png" alt="Aulas interativas online" className="hero-image" />
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title animate-in">O Futuro do Seu Aprendizado</h2>
          <div className="features-grid">
            <div className="hyper-glass-card animate-in delay-100">
              <div className="feature-icon">
                <Target size={32} />
              </div>
              <h3 className="feature-title">Precisão Cirúrgica</h3>
              <p className="feature-desc">
                Não perca tempo com genéricos. Cada módulo é adaptado para o seu momento de vida, seja Business, Viagens ou Certificações Internacionais.
              </p>
            </div>
            <div className="hyper-glass-card animate-in delay-200">
              <div className="feature-icon">
                <Calendar size={32} />
              </div>
              <h3 className="feature-title">Controle Absoluto</h3>
              <p className="feature-desc">
                Sua agenda, suas regras. Cancele, remarque ou adicione aulas em uma plataforma ultra-responsiva e sem burocracias.
              </p>
            </div>
            <div className="hyper-glass-card animate-in delay-300">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3 className="feature-title">Ecossistema Completo</h3>
              <p className="feature-desc">
                Receba feedback instantâneo, acesse o histórico de evolução e mantenha o foco total na fluência com ferramentas premium.
              </p>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section">
          <h2 className="section-title animate-in">Aprovado por Líderes</h2>
          <div className="reviews-grid">
            <div className="hyper-glass-card animate-in delay-100">
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
            </div>
            <div className="hyper-glass-card animate-in delay-200">
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
            </div>
            <div className="hyper-glass-card animate-in delay-300">
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
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <h2 className="cta-title animate-in">Eleve o Nível do seu Inglês.</h2>
          <p className="cta-subtitle animate-in delay-100">
            Junte-se à elite de alunos que aceleraram suas carreiras e vivências através de uma metodologia de alto impacto.
          </p>
          <div className="cta-buttons animate-in delay-200">
            <Link to="/login" className="hero-cta">
              Acessar a Plataforma
              <ArrowRight size={20} />
            </Link>
            <a href="mailto:contato@teacherjorge.com" className="cta-outline-btn">
              Falar com o Professor
            </a>
          </div>
        </section>
        
        <footer className="landing-footer animate-in delay-300">
          <p>&copy; {new Date().getFullYear()} Teacher Jorge. Aulas de Alto Desempenho.</p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;

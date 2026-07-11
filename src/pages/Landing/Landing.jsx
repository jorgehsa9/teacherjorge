import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Target, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-logo">
          <BookOpen className="text-primary" size={28} />
          Teacher Jorge
        </Link>
        <Link to="/login" className="landing-nav-btn">
          Portal do Aluno
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <span className="hero-tag">Aulas Particulares de Inglês</span>
          <h1 className="hero-title">Aprenda Inglês de Forma Personalizada</h1>
          <p className="hero-subtitle">
            Aulas focadas nos seus objetivos reais. Ganhe fluência com conversação, preparação para exames e material exclusivo para acelerar o seu aprendizado.
          </p>
          <Link to="/login" className="hero-cta">
            Começar Agora
            <ArrowRight size={20} />
          </Link>
        </div>
        <div className="hero-image-wrapper">
          <img src="/landing_hero.png" alt="Aulas interativas online" className="hero-image" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Por que escolher minha metodologia?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Target size={32} />
            </div>
            <h3 className="feature-title">Foco 100% em Você</h3>
            <p className="feature-desc">
              Cada aula é desenhada para as suas necessidades, seja para negócios, viagens ou para passar em certificações internacionais (IELTS, TOEFL).
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={32} />
            </div>
            <h3 className="feature-title">Flexibilidade Total</h3>
            <p className="feature-desc">
              Agendamento fácil através do nosso portal exclusivo. Remarque ou cancele aulas com facilidade de acordo com a sua agenda.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3 className="feature-title">Acompanhamento Contínuo</h3>
            <p className="feature-desc">
              Acesso a materiais de estudo exclusivos, exercícios extras e feedback constante para garantir a sua evolução a cada semana.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2 className="section-title">O que os alunos dizem</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
            </div>
            <p className="review-quote">
              "As aulas com o Jorge mudaram a minha forma de ver o inglês. A abordagem prática me deu confiança para finalmente liderar reuniões com meu time no exterior."
            </p>
            <div className="review-author">
              <div className="review-avatar">M</div>
              <div>
                <span className="review-name">Mariana S.</span>
                <span className="review-role">Tech Lead</span>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
            </div>
            <p className="review-quote">
              "Consegui a nota que precisava no IELTS em apenas 3 meses! O material personalizado focado nas minhas fraquezas foi o diferencial."
            </p>
            <div className="review-author">
              <div className="review-avatar">R</div>
              <div>
                <span className="review-name">Rafael C.</span>
                <span className="review-role">Estudante de Intercâmbio</span>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
              <Star fill="currentColor" size={20} />
            </div>
            <p className="review-quote">
              "A plataforma do aluno é sensacional. Consigo ver minhas próximas aulas, materiais recomendados e fazer o pagamento mensal num só lugar."
            </p>
            <div className="review-author">
              <div className="review-avatar">F</div>
              <div>
                <span className="review-name">Fernanda L.</span>
                <span className="review-role">Marketing Manager</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2 className="cta-title">Pronto para dar o próximo passo?</h2>
        <p className="cta-subtitle">
          Junte-se aos nossos alunos e desbloqueie novas oportunidades na sua carreira e vida pessoal através do inglês.
        </p>
        <div className="cta-buttons">
          <Link to="/login" className="hero-cta">
            Acessar Área do Aluno
            <ArrowRight size={20} />
          </Link>
          <a href="mailto:contato@teacherjorge.com" className="cta-outline-btn">
            Entrar em Contato
          </a>
        </div>
      </section>
      
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Teacher Jorge. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;

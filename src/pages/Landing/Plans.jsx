import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import './Plans.css';

const Plans = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (planId) => {
    navigate(`/apply?plan=${planId}`);
  };

  return (
    <div className="plans-container">
      
      <div className="plans-orb plans-orb-1"></div>
      <div className="plans-orb plans-orb-2"></div>

      <div className="plans-content">
        
        <div className="plans-header">
          <button onClick={() => navigate('/')} className="plans-logo">
            <BookOpen className="text-primary" size={28} />
            Teacher Jorge
          </button>
          
          <div className="plans-nav">
            <button onClick={() => navigate('/')} className="plans-nav-btn">Home</button>
            <button className="plans-nav-btn active">Pricing</button>
            <button className="plans-nav-btn">FAQ</button>
            <button onClick={() => navigate('/login')} className="plans-nav-btn">Login</button>
          </div>

          <button onClick={() => navigate('/apply')} className="plans-btn-start">
            Começar
          </button>
        </div>

        <div className="plans-grid">
          {/* Steady Pace Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="plan-card"
          >
            <h3 className="plan-title">Steady Pace</h3>
            
            <div className="plan-price-wrapper">
              <span className="plan-price">R$ 160</span>
              <span className="plan-period">/mês</span>
            </div>
            
            <p className="plan-desc">
              Para alunos que querem manter o contato semanal com o idioma e progredir com consistência.
            </p>

            <ul className="plan-features">
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span><strong>1 Aula</strong> por semana</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>4 aulas por mês</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>Acesso ao Meu Livro de Inglês</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>Valor base R$ 40/hora</span>
              </li>
            </ul>

            <button 
              onClick={() => handleSelectPlan('1x_semana')}
              className="plan-btn"
            >
              Choose Plan
            </button>
          </motion.div>

          {/* Fast Track Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="plan-card"
          >
            <h3 className="plan-title">Fast Track</h3>
            
            <div className="plan-price-wrapper">
              <span className="plan-price">R$ 320</span>
              <span className="plan-period">/mês</span>
            </div>
            
            <p className="plan-desc">
              Para quem quer acelerar o aprendizado e imergir no idioma para resultados rápidos e profissionais.
            </p>

            <ul className="plan-features">
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span><strong>2 Aulas</strong> por semana</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>8 aulas por mês</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>Acesso Prioritário no Calendário</span>
              </li>
              <li className="plan-feature">
                <div className="plan-feature-icon">
                  <Check size={12} color="#A855F7" />
                </div>
                <span>Valor base R$ 40/hora</span>
              </li>
            </ul>

            <button 
              onClick={() => handleSelectPlan('2x_semana')}
              className="plan-btn"
            >
              Choose Plan
            </button>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
};

export default Plans;

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, User, Mail, Phone, Target, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import './Apply.css';

const Apply = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [searchParams] = useSearchParams();
  const planQuery = searchParams.get('plan');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    level: 'Iniciante',
    goals: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('Leads')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          level: formData.level,
          goals: formData.goals,
          status: 'Applied',
          plan: planQuery || 'Padrão'
        }]);

      if (error) throw error;

      // Realiza o cadastro do usuário
      await signup(formData.email, formData.password, formData.name);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#FFFFFF', '#4F46E5']
      });

      // Redireciona para o dashboard após a criação
      navigate('/dashboard');

    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Ocorreu um erro ao enviar sua aplicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="apply-container">
        <div className="apply-orb apply-orb-1"></div>
        <div className="apply-orb apply-orb-2"></div>
        <div className="apply-content" style={{ justifyContent: 'center' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="apply-success-card"
          >
            <div className="apply-success-icon">
              <CheckCircle size={40} />
            </div>
            <h2 className="apply-success-title">Aplicação Recebida!</h2>
            <p className="apply-success-text">
              Obrigado pelo interesse, {formData.name.split(' ')[0]}! Nossa equipe analisará seu perfil e entrará em contato em breve para agendar sua aula teste.
            </p>
            <button onClick={() => navigate('/')} className="apply-btn">
              Voltar para o Início
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-container">
      <div className="apply-orb apply-orb-1"></div>
      <div className="apply-orb apply-orb-2"></div>

      <div className="apply-content">
        
        {/* Header */}
        <div className="apply-header">
          <button onClick={() => navigate('/')} className="apply-logo">
            <BookOpen size={28} color="#A855F7" />
            Teacher Jorge
          </button>
          <button onClick={() => navigate(-1)} className="apply-back-btn">
            Voltar
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="apply-title-group"
        >
          <h1 className="apply-title">
            Transforme seu potencial.
          </h1>
          <p className="apply-subtitle">
            Preencha o formulário abaixo para garantir sua vaga e agendar uma aula de avaliação gratuita.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="apply-card"
        >
          {planQuery && (
            <div className="apply-plan-alert">
              <CheckCircle size={20} color="#A855F7" />
              <span>
                Plano Selecionado: <strong>{planQuery === '2x_semana' ? 'Fast Track (2x/Semana - R$320)' : 'Steady Pace (1x/Semana - R$160)'}</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="apply-form-group">
              <label className="apply-label">
                <User size={16} color="#A855F7" /> Nome Completo
              </label>
              <input
                type="text"
                name="name"
                required
                className="apply-input"
                placeholder="Digite seu nome"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="apply-form-row">
              <div className="apply-form-group">
                <label className="apply-label">
                  <Mail size={16} color="#A855F7" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="apply-input"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="apply-form-group">
                <label className="apply-label">
                  <Lock size={16} color="#A855F7" /> Criar Senha
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength="6"
                  className="apply-input"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="apply-form-group">
              <label className="apply-label">
                <Phone size={16} color="#A855F7" /> WhatsApp
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="apply-input"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="apply-form-group">
              <label className="apply-label">
                <BookOpen size={16} color="#A855F7" /> Nível Atual
              </label>
              <select
                name="level"
                className="apply-input apply-select"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="Iniciante">Iniciante (Começando do zero)</option>
                <option value="Básico">Básico (Sei algumas palavras)</option>
                <option value="Intermediário">Intermediário (Consigo me comunicar o básico)</option>
                <option value="Avançado">Avançado (Busco fluência total)</option>
              </select>
            </div>

            <div className="apply-form-group">
              <label className="apply-label">
                <Target size={16} color="#A855F7" /> Quais são seus principais objetivos?
              </label>
              <textarea
                name="goals"
                required
                rows="3"
                className="apply-input"
                style={{ resize: 'none' }}
                placeholder="Ex: Viagem, trabalho, desenvolvimento pessoal..."
                value={formData.goals}
                onChange={handleChange}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="apply-btn"
            >
              {loading ? 'Enviando...' : 'Garantir Minha Vaga'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
};

export default Apply;

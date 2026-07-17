import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Mail, Phone, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const Apply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
          status: 'Applied'
        }]);

      if (error) throw error;

      setSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#FFFFFF', '#4F46E5']
      });

    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Ocorreu um erro ao enviar sua aplicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg-color" style={{ background: 'var(--bg-gradient)' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card liquid-glass max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-success-light text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Aplicação Recebida!</h2>
          <p className="text-muted mb-8">
            Obrigado pelo interesse, {formData.name.split(' ')[0]}! Nossa equipe analisará seu perfil e entrará em contato em breve para agendar sua aula teste.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary btn-glass w-full">
            Voltar para o Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div className="font-bold text-2xl tracking-tighter" style={{ color: 'var(--primary)' }}>
          teacherjorge.
        </div>
        <button onClick={() => navigate('/')} className="text-muted hover:text-white transition-colors text-sm">
          Voltar
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ letterSpacing: '-0.03em' }}>
            Transforme seu potencial.
          </h1>
          <p className="text-lg text-muted">
            Preencha o formulário abaixo para garantir sua vaga e agendar uma aula de avaliação gratuita.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card liquid-glass p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <User size={16} /> Nome Completo
            </label>
            <input
              type="text"
              name="name"
              required
              className="input w-full p-3 bg-surface border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Digite seu nome"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="input w-full p-3 bg-surface border border-border rounded-xl focus:border-primary outline-none transition-all"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted flex items-center gap-2">
                <Phone size={16} /> WhatsApp
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="input w-full p-3 bg-surface border border-border rounded-xl focus:border-primary outline-none transition-all"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <BookOpen size={16} /> Nível Atual
            </label>
            <select
              name="level"
              className="input w-full p-3 bg-surface border border-border rounded-xl focus:border-primary outline-none transition-all appearance-none"
              style={{ color: 'var(--text-main)' }}
              value={formData.level}
              onChange={handleChange}
            >
              <option value="Iniciante">Iniciante (Começando do zero)</option>
              <option value="Básico">Básico (Sei algumas palavras)</option>
              <option value="Intermediário">Intermediário (Consigo me comunicar o básico)</option>
              <option value="Avançado">Avançado (Busco fluência total)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <Target size={16} /> Quais são seus principais objetivos?
            </label>
            <textarea
              name="goals"
              required
              rows="3"
              className="input w-full p-3 bg-surface border border-border rounded-xl focus:border-primary outline-none transition-all resize-none"
              placeholder="Ex: Viagem, trabalho, desenvolvimento pessoal..."
              value={formData.goals}
              onChange={handleChange}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary btn-glass w-full py-4 text-lg font-bold flex justify-center items-center gap-2 rounded-xl mt-4"
          >
            {loading ? 'Enviando...' : 'Garantir Minha Vaga'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Apply;

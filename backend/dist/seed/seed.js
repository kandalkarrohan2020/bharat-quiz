import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });
import { Category } from '../models/category.model.js';
import { User } from '../models/user.model.js';
import { QuizAttempt } from '../models/quiz-attempt.model.js';
import { logger } from '../utils/logger.js';
// ============================================================
// Seed Data (sourced from categories.ts)
// ============================================================
const categorySeedData = [
    {
        legacyId: 'history',
        name: 'History',
        slug: 'history',
        icon: '🏛️',
        description: "Journey through India's glorious past",
        color: 'from-amber-700 to-yellow-600',
        questions: [
            { legacyId: 'h1', question: 'Who was the first Emperor of the Maurya Dynasty?', options: ['Ashoka', 'Chandragupta Maurya', 'Bindusara', 'Brihadratha'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'h2', question: 'In which year did India gain independence?', options: ['1945', '1946', '1947', '1948'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'h3', question: 'Who built the Taj Mahal?', options: ['Akbar', 'Shah Jahan', 'Jahangir', 'Aurangzeb'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'h4', question: 'The Battle of Plassey was fought in which year?', options: ['1757', '1764', '1857', '1761'], correctAnswer: 0, difficulty: 'medium' },
            { legacyId: 'h5', question: 'Who was known as the "Iron Man of India"?', options: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'Sardar Vallabhbhai Patel', 'Bhagat Singh'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'h6', question: 'Which Mughal emperor introduced the Mansabdari system?', options: ['Babur', 'Humayun', 'Akbar', 'Shah Jahan'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'h7', question: 'The Dandi March was associated with which movement?', options: ['Quit India', 'Non-Cooperation', 'Civil Disobedience', 'Swadeshi'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'h8', question: 'Who founded the Gupta Empire?', options: ['Chandragupta I', 'Samudragupta', 'Kumaragupta', 'Sri Gupta'], correctAnswer: 3, difficulty: 'hard' },
            { legacyId: 'h9', question: 'Which Indian queen fought against the British in the Revolt of 1857?', options: ['Razia Sultana', 'Rani Lakshmibai', 'Ahilyabai Holkar', 'Kittur Chennamma'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'h10', question: 'The Chola dynasty was known for its naval power in which ocean?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correctAnswer: 2, difficulty: 'medium' },
        ],
    },
    {
        legacyId: 'culture',
        name: 'Culture',
        slug: 'culture',
        icon: '🎭',
        description: "Explore India's rich cultural heritage",
        color: 'from-pink-600 to-rose-500',
        questions: [
            { legacyId: 'c1', question: 'Which classical dance form originates from Kerala?', options: ['Bharatanatyam', 'Kathakali', 'Odissi', 'Kuchipudi'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'c2', question: 'How many languages are listed in the 8th Schedule of the Indian Constitution?', options: ['18', '20', '22', '24'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'c3', question: 'Which festival is known as the "Festival of Lights"?', options: ['Holi', 'Diwali', 'Navratri', 'Pongal'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'c4', question: 'The sitar is associated with which music tradition?', options: ['Carnatic', 'Hindustani', 'Folk', 'Sufi'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'c5', question: 'Which state is famous for the Bihu dance?', options: ['Assam', 'Gujarat', 'Punjab', 'Rajasthan'], correctAnswer: 0, difficulty: 'medium' },
            { legacyId: 'c6', question: 'Rangoli is traditionally made using what materials?', options: ['Paint', 'Colored powder & flowers', 'Clay', 'Paper'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'c7', question: 'Which Indian textile art involves tie-dye technique?', options: ['Chikankari', 'Bandhani', 'Kalamkari', 'Phulkari'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'c8', question: 'The Ajanta caves are famous for what?', options: ['Sculptures', 'Paintings', 'Architecture', 'All of the above'], correctAnswer: 3, difficulty: 'medium' },
            { legacyId: 'c9', question: 'Which martial art form is native to Kerala?', options: ['Gatka', 'Kalaripayattu', 'Silambam', 'Thang-Ta'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'c10', question: 'The Konark Sun Temple is located in which state?', options: ['Madhya Pradesh', 'Odisha', 'Rajasthan', 'Tamil Nadu'], correctAnswer: 1, difficulty: 'medium' },
        ],
    },
    {
        legacyId: 'science',
        name: 'Science',
        slug: 'science',
        icon: '🔬',
        description: "India's contributions to science & tech",
        color: 'from-cyan-600 to-blue-500',
        questions: [
            { legacyId: 's1', question: 'Who is known as the "Missile Man of India"?', options: ['Vikram Sarabhai', 'Homi Bhabha', 'APJ Abdul Kalam', 'C.V. Raman'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 's2', question: "ISRO's Mars Orbiter Mission is also known as?", options: ['Chandrayaan', 'Mangalyaan', 'Gaganyaan', 'Aditya'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 's3', question: 'Who discovered the Raman Effect?', options: ['Homi Bhabha', 'Satyendra Nath Bose', 'C.V. Raman', 'Meghnad Saha'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 's4', question: 'The concept of zero was first used by mathematicians in which country?', options: ['Greece', 'Egypt', 'India', 'China'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 's5', question: 'Chandrayaan-3 successfully landed on which part of the Moon?', options: ['North Pole', 'South Pole', 'Near Side', 'Far Side'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 's6', question: 'Who is the father of Indian nuclear programme?', options: ['APJ Abdul Kalam', 'Homi J. Bhabha', 'Vikram Sarabhai', 'Raja Ramanna'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 's7', question: "Aryabhata, India's first satellite, was launched in which year?", options: ['1969', '1972', '1975', '1980'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 's8', question: 'The Sushruta Samhita is an ancient text on what subject?', options: ['Astronomy', 'Mathematics', 'Surgery', 'Philosophy'], correctAnswer: 2, difficulty: 'hard' },
            { legacyId: 's9', question: 'Which Indian scientist proposed the Bose-Einstein statistics?', options: ['C.V. Raman', 'Satyendra Nath Bose', 'Meghnad Saha', 'Jagadish Chandra Bose'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 's10', question: "India's first supercomputer was named?", options: ['PARAM', 'Pratyush', 'Shakti', 'Aditya'], correctAnswer: 0, difficulty: 'hard' },
        ],
    },
    {
        legacyId: 'sports',
        name: 'Sports',
        slug: 'sports',
        icon: '🏏',
        description: 'Test your Indian sports knowledge',
        color: 'from-green-600 to-emerald-500',
        questions: [
            { legacyId: 'sp1', question: 'Who is known as the "God of Cricket"?', options: ['Virat Kohli', 'MS Dhoni', 'Sachin Tendulkar', 'Kapil Dev'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'sp2', question: 'In which year did India win its first Cricket World Cup?', options: ['1975', '1983', '1987', '1992'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'sp3', question: 'Which Indian athlete won gold in javelin at the 2020 Tokyo Olympics?', options: ['Abhinav Bindra', 'Neeraj Chopra', 'Sushil Kumar', 'PV Sindhu'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'sp4', question: "Hockey India's famous player Dhyan Chand was known as?", options: ['Hockey King', 'The Wizard', 'Hockey Star', 'Golden Boy'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'sp5', question: 'Which is the national game of India?', options: ['Cricket', 'Hockey', 'Kabaddi', 'No official national game'], correctAnswer: 3, difficulty: 'hard' },
            { legacyId: 'sp6', question: 'Who was the first Indian to win an individual Olympic gold medal?', options: ['Leander Paes', 'Abhinav Bindra', 'Karnam Malleswari', 'Rajyavardhan Rathore'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'sp7', question: 'The IPL was founded in which year?', options: ['2006', '2007', '2008', '2009'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'sp8', question: 'PV Sindhu is associated with which sport?', options: ['Tennis', 'Badminton', 'Table Tennis', 'Wrestling'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'sp9', question: 'Which chess grandmaster from India became the youngest world champion?', options: ['Viswanathan Anand', 'D. Gukesh', 'Praggnanandhaa', 'Koneru Humpy'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'sp10', question: 'Mary Kom is associated with which sport?', options: ['Wrestling', 'Boxing', 'Judo', 'Weightlifting'], correctAnswer: 1, difficulty: 'easy' },
        ],
    },
    {
        legacyId: 'entertainment',
        name: 'Entertainment',
        slug: 'entertainment',
        icon: '🎬',
        description: 'Bollywood, music & Indian entertainment',
        color: 'from-purple-600 to-violet-500',
        questions: [
            { legacyId: 'e1', question: "Which was India's first full-length feature film?", options: ['Alam Ara', 'Raja Harishchandra', 'Mughal-e-Azam', 'Devdas'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'e2', question: 'Who is known as the "King of Bollywood"?', options: ['Amitabh Bachchan', 'Shah Rukh Khan', 'Salman Khan', 'Aamir Khan'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'e3', question: 'Which Indian film won the Academy Award for Best Picture?', options: ['Lagaan', 'Slumdog Millionaire', 'RRR', 'None - no Indian film has won'], correctAnswer: 3, difficulty: 'hard' },
            { legacyId: 'e4', question: 'AR Rahman won the Oscar for music in which film?', options: ['Lagaan', 'Roja', 'Slumdog Millionaire', 'Bombay'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'e5', question: 'Which actor played the host in the Indian version of "Who Wants to Be a Millionaire"?', options: ['Shah Rukh Khan', 'Amitabh Bachchan', 'Salman Khan', 'Anil Kapoor'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'e6', question: 'The Filmfare Awards were first held in which year?', options: ['1950', '1953', '1954', '1960'], correctAnswer: 2, difficulty: 'hard' },
            { legacyId: 'e7', question: 'Which Indian web series is based on the Mumbai underworld?', options: ['Mirzapur', 'Sacred Games', 'Paatal Lok', 'Scam 1992'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'e8', question: 'Lata Mangeshkar was popularly known as?', options: ['Queen of Music', 'Melody Queen', 'Nightingale of India', 'Sur Samragni'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'e9', question: 'Which Bollywood movie holds the record for highest worldwide gross?', options: ['Dangal', 'Baahubali 2', 'Pathaan', 'Jawan'], correctAnswer: 0, difficulty: 'hard' },
            { legacyId: 'e10', question: 'The Natyashastra, an ancient treatise on performing arts, was written by?', options: ['Kalidasa', 'Bharata Muni', 'Valmiki', 'Tulsidas'], correctAnswer: 1, difficulty: 'hard' },
        ],
    },
    {
        legacyId: 'pune-iks-exam',
        name: 'Pune Uni IKS Exam',
        slug: 'pune-uni-iks-exam',
        icon: '🎓',
        description: 'Pune University IKS exam preparation questions',
        color: 'from-orange-600 to-amber-500',
        questions: [
            { legacyId: 'piks1', question: 'What does IKS stand for in the context of Indian education?', options: ['Indian Knowledge Systems', 'International Knowledge Standards', 'Indian Knowledge Standards', 'Integrated Knowledge Systems'], correctAnswer: 0, difficulty: 'easy' },
            { legacyId: 'piks2', question: "Which ancient Indian university is considered the world's first residential university?", options: ['Takshashila', 'Nalanda', 'Vikramashila', 'Vallabhi'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'piks3', question: 'The Arthashastra was authored by?', options: ['Manu', 'Kautilya (Chanakya)', 'Patanjali', 'Panini'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'piks4', question: 'Which Veda is considered the oldest?', options: ['Samaveda', 'Yajurveda', 'Atharvaveda', 'Rigveda'], correctAnswer: 3, difficulty: 'easy' },
            { legacyId: 'piks5', question: 'The Sulbasutras are ancient Indian texts related to?', options: ['Music', 'Geometry & Altar construction', 'Medicine', 'Astronomy'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks6', question: 'Who wrote the Ashtadhyayi, a foundational text on Sanskrit grammar?', options: ['Patanjali', 'Panini', 'Katyayana', 'Bhartrihari'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks7', question: 'Charaka Samhita is an ancient Indian treatise on?', options: ['Surgery', 'Internal Medicine (Ayurveda)', 'Yoga', 'Architecture'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks8', question: 'The concept of "Panchkosha" in Indian philosophy refers to?', options: ['Five elements', 'Five sheaths of the self', 'Five senses', 'Five duties'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'piks9', question: 'Which ancient Indian mathematician calculated the value of Pi accurately?', options: ['Brahmagupta', 'Aryabhata', 'Bhaskaracharya', 'Varahamihira'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks10', question: 'Yoga Sutras were compiled by?', options: ['Swami Vivekananda', 'Adi Shankaracharya', 'Patanjali', 'Maharishi Vyasa'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'piks11', question: 'NEP 2020 emphasizes IKS integration primarily for?', options: ['Replacing modern education', 'Holistic and multidisciplinary learning', 'Religious instruction', 'Only Sanskrit studies'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks12', question: 'The Nyaya Shastra is an Indian philosophical system focused on?', options: ['Ethics', 'Logic and epistemology', 'Metaphysics', 'Aesthetics'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'piks13', question: 'Which ancient text describes 64 arts (Chatushashti Kalas)?', options: ['Kamasutra', 'Arthashastra', 'Natyashastra', 'Manusmriti'], correctAnswer: 0, difficulty: 'hard' },
            { legacyId: 'piks14', question: 'Takshashila university was located in present-day?', options: ['India', 'Pakistan', 'Afghanistan', 'Nepal'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'piks15', question: 'The Jyotish Vedanga deals with?', options: ['Grammar', 'Astronomy & Astrology', 'Rituals', 'Phonetics'], correctAnswer: 1, difficulty: 'hard' },
        ],
    },
    {
        legacyId: 'iks-vedic-math',
        name: 'IKS: Vedic Mathematics',
        slug: 'iks-vedic-mathematics',
        icon: '🔢',
        description: 'Ancient Indian mathematical knowledge systems',
        color: 'from-indigo-600 to-blue-500',
        questions: [
            { legacyId: 'vm1', question: 'How many sutras are there in Vedic Mathematics?', options: ['12', '14', '16', '18'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'vm2', question: 'Vedic Mathematics was rediscovered and popularized by?', options: ['Srinivasa Ramanujan', 'Swami Bharati Krishna Tirtha', 'Aryabhata', 'Shakuntala Devi'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'vm3', question: 'The "Nikhilam" sutra in Vedic Math is used for?', options: ['Addition', 'Subtraction', 'Multiplication', 'Division'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'vm4', question: 'Aryabhata introduced the place value system using which base?', options: ['Base 8', 'Base 10', 'Base 12', 'Base 16'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'vm5', question: 'The concept of infinity in Indian mathematics is attributed to?', options: ['Brahmagupta', 'Bhaskaracharya II', 'Aryabhata', 'Madhava'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'vm6', question: 'The Kerala School of Mathematics made significant contributions to?', options: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'vm7', question: "Brahmagupta's formula calculates the area of?", options: ['Triangle', 'Cyclic quadrilateral', 'Circle', 'Pentagon'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'vm8', question: 'Which ancient Indian text contains the Pythagorean theorem before Pythagoras?', options: ['Vedas', 'Sulbasutras', 'Arthashastra', 'Upanishads'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'vm9', question: 'The decimal number system originated in?', options: ['Greece', 'Arabia', 'India', 'China'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'vm10', question: 'Madhava of Sangamagrama is credited with discovering?', options: ['Zero', 'Infinite series for trigonometric functions', 'Algebra', 'Negative numbers'], correctAnswer: 1, difficulty: 'hard' },
        ],
    },
    {
        legacyId: 'iks-ayurveda',
        name: 'IKS: Ayurveda & Health',
        slug: 'iks-ayurveda-health',
        icon: '🌿',
        description: 'Ancient Indian medicine and wellness systems',
        color: 'from-lime-600 to-green-500',
        questions: [
            { legacyId: 'ay1', question: 'How many doshas are described in Ayurveda?', options: ['2', '3', '4', '5'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ay2', question: 'Which are the three doshas in Ayurveda?', options: ['Vata, Pitta, Kapha', 'Sattva, Rajas, Tamas', 'Prana, Tejas, Ojas', 'Agni, Soma, Vayu'], correctAnswer: 0, difficulty: 'easy' },
            { legacyId: 'ay3', question: 'Sushruta is considered the father of?', options: ['Ayurveda', 'Surgery', 'Yoga', 'Pharmacy'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ay4', question: 'Panchakarma in Ayurveda refers to?', options: ['Five senses', 'Five detoxification procedures', 'Five herbs', 'Five exercises'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ay5', question: 'Which ancient text is considered the foundation of Ayurveda?', options: ['Rigveda', 'Atharvaveda', 'Yajurveda', 'Samaveda'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ay6', question: 'The concept of "Prakriti" in Ayurveda means?', options: ['Nature', 'Body constitution', 'Medicine', 'Diet'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ay7', question: 'Dhanwantari is the god of?', options: ['War', 'Medicine', 'Knowledge', 'Wealth'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ay8', question: 'The eight branches of Ayurveda are called?', options: ['Ashtanga Ayurveda', 'Ashtanga Hridaya', 'Ashtanga Yoga', 'Ashtadhyayi'], correctAnswer: 0, difficulty: 'hard' },
            { legacyId: 'ay9', question: '"Rasayana" in Ayurveda deals with?', options: ['Surgery', 'Rejuvenation therapy', 'Pediatrics', 'Toxicology'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'ay10', question: 'Which spice is known as "Golden Spice" in Ayurveda?', options: ['Cardamom', 'Saffron', 'Turmeric', 'Cinnamon'], correctAnswer: 2, difficulty: 'easy' },
        ],
    },
    {
        legacyId: 'iks-philosophy',
        name: 'IKS: Indian Philosophy',
        slug: 'iks-indian-philosophy',
        icon: '🕉️',
        description: 'Darshanas and philosophical traditions of India',
        color: 'from-yellow-600 to-orange-500',
        questions: [
            { legacyId: 'ph1', question: 'How many orthodox (Astika) schools of Indian philosophy are there?', options: ['4', '5', '6', '8'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'ph2', question: 'The Advaita Vedanta philosophy was propounded by?', options: ['Ramanuja', 'Madhvacharya', 'Adi Shankaracharya', 'Vallabhacharya'], correctAnswer: 2, difficulty: 'easy' },
            { legacyId: 'ph3', question: 'Which school of philosophy focuses on logic and reasoning?', options: ['Sankhya', 'Nyaya', 'Vaisheshika', 'Mimamsa'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ph4', question: 'The Bhagavad Gita is a part of which epic?', options: ['Ramayana', 'Mahabharata', 'Puranas', 'Vedas'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ph5', question: 'Sankhya philosophy describes how many tattvas (principles)?', options: ['20', '24', '25', '30'], correctAnswer: 2, difficulty: 'hard' },
            { legacyId: 'ph6', question: '"Ahimsa Paramo Dharma" is a principle from?', options: ['Buddhism only', 'Jainism only', 'Hinduism only', 'All Indian traditions'], correctAnswer: 3, difficulty: 'medium' },
            { legacyId: 'ph7', question: 'The concept of "Karma" originates from which tradition?', options: ['Buddhism', 'Jainism', 'Hinduism', 'All of the above'], correctAnswer: 3, difficulty: 'easy' },
            { legacyId: 'ph8', question: 'Charvaka philosophy is also known as?', options: ['Lokayata', 'Vaisheshika', 'Mimamsa', 'Vedanta'], correctAnswer: 0, difficulty: 'hard' },
            { legacyId: 'ph9', question: 'The Upanishads primarily deal with?', options: ['Rituals', 'Grammar', 'Philosophical knowledge (Brahman/Atman)', 'Astronomy'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'ph10', question: 'How many principal Upanishads are commonly studied?', options: ['8', '10', '12', '108'], correctAnswer: 3, difficulty: 'hard' },
        ],
    },
    {
        legacyId: 'iks-science-tech',
        name: 'IKS: Ancient Science',
        slug: 'iks-ancient-science',
        icon: '⚗️',
        description: 'Scientific achievements of ancient India',
        color: 'from-teal-600 to-cyan-500',
        questions: [
            { legacyId: 'ast1', question: 'The Vastu Shastra is an ancient Indian science of?', options: ['Astronomy', 'Architecture', 'Agriculture', 'Medicine'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ast2', question: 'Kanada, an ancient Indian sage, is known for proposing?', options: ['Theory of evolution', 'Atomic theory (Anu)', 'Theory of gravity', 'Theory of sound'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ast3', question: 'The Surya Siddhanta is an ancient text on?', options: ['Solar energy', 'Astronomy', 'Medicine', 'Metallurgy'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ast4', question: 'The Iron Pillar of Delhi is famous for its resistance to?', options: ['Earthquakes', 'Rust/corrosion', 'Lightning', 'Heat'], correctAnswer: 1, difficulty: 'easy' },
            { legacyId: 'ast5', question: 'Wootz steel, one of the finest steels in the ancient world, originated in?', options: ['China', 'Rome', 'India', 'Persia'], correctAnswer: 2, difficulty: 'medium' },
            { legacyId: 'ast6', question: 'Which ancient Indian text describes Vimanas (flying machines)?', options: ['Arthashastra', 'Vaimanika Shastra', 'Surya Siddhanta', 'Brihat Samhita'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'ast7', question: 'The ancient Indian water harvesting system "Stepwell" (Vav) is most famous in?', options: ['Kerala', 'Gujarat & Rajasthan', 'Tamil Nadu', 'Bengal'], correctAnswer: 1, difficulty: 'medium' },
            { legacyId: 'ast8', question: 'Nagarjuna was an ancient Indian alchemist and expert in?', options: ['Astronomy', 'Chemistry/Rasayana', 'Surgery', 'Mathematics'], correctAnswer: 1, difficulty: 'hard' },
            { legacyId: 'ast9', question: 'The Indus Valley Civilization had advanced knowledge of?', options: ['Urban planning & drainage', 'Nuclear energy', 'Printing', 'Gunpowder'], correctAnswer: 0, difficulty: 'easy' },
            { legacyId: 'ast10', question: 'Baudhayana Sulbasutra contains an early version of which theorem?', options: ["Fermat's theorem", 'Pythagorean theorem', "Euler's theorem", 'Binomial theorem'], correctAnswer: 1, difficulty: 'hard' },
        ],
    },
];
// ============================================================
// Seed Function
// ============================================================
const seed = async () => {
    const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/india_quiz_db';
    try {
        await mongoose.connect(uri);
        logger.info('✅ Connected to MongoDB for seeding...');
        // Clear existing data
        await Promise.all([
            Category.deleteMany({}),
            QuizAttempt.deleteMany({}),
        ]);
        logger.info('🗑️  Cleared existing categories and quiz attempts');
        // Insert categories
        const inserted = await Category.insertMany(categorySeedData);
        logger.info(`✅ Seeded ${inserted.length} categories with all questions`);
        // Seed a default admin user if not present
        const adminExists = await User.findOne({ email: 'admin@indiaquiz.com' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'admin@indiaquiz.com',
                password: 'Admin@12345',
                role: 'admin',
            });
            logger.info('✅ Admin user created → admin@indiaquiz.com / Admin@12345');
        }
        else {
            logger.info('ℹ️  Admin user already exists, skipping.');
        }
        logger.info('\n🎉 Seeding complete! Summary:');
        logger.info(`   Categories : ${inserted.length}`);
        logger.info(`   Questions  : ${categorySeedData.reduce((acc, c) => acc + c.questions.length, 0)}`);
    }
    catch (err) {
        logger.error(`❌ Seeding failed: ${err.message}`);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected after seeding.');
        process.exit(0);
    }
};
seed();
//# sourceMappingURL=seed.js.map
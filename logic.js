// Tech Keywords Database
const TECH_KEYWORDS = {
  backend: ['node', 'nodejs', 'express', 'java', 'python', 'django', 'flask', 'spring', 'api', 'server', 'backend', 'nestjs', 'fastapi', 'golang', 'go'],
  frontend: ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'ui', 'ux', 'frontend', 'tailwind', 'bootstrap', 'next.js'],
  database: ['mysql', 'mongodb', 'sql', 'postgres', 'postgresql', 'cassandra', 'redis', 'elasticsearch', 'firestore'],
  devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'gitlab', 'github', 'terraform', 'ansible'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'lambda', 's3', 'ec2', 'heroku'],
  testing: ['jest', 'mocha', 'chai', 'testing', 'qa', 'cypress', 'selenium', 'junit'],
};

// Global state
let userSkills = [];
let analysisHistory = [];
let currentViewedIdx = null; // Track which analysis is being viewed

// ============================================
// LOAD DATA FROM LOCALSTORAGE
// ============================================
function loadData() {
  userSkills = JSON.parse(localStorage.getItem('userSkills')) || [];
  analysisHistory = JSON.parse(localStorage.getItem('analysisHistory')) || [];
  renderSkills();
  renderHistory();
}

// ============================================
// SKILL MANAGEMENT
// ============================================
function addSkill() {
  const input = document.getElementById('skillInput');
  const skill = input.value.trim().toLowerCase();
  
  if (skill && !userSkills.includes(skill)) {
    userSkills.push(skill);
    localStorage.setItem('userSkills', JSON.stringify(userSkills));
    input.value = '';
    renderSkills();
  }
}

function removeSkill(skill) {
  userSkills = userSkills.filter(s => s !== skill);
  localStorage.setItem('userSkills', JSON.stringify(userSkills));
  renderSkills();
}

function renderSkills() {
  const container = document.getElementById('skillsTags');
  if (userSkills.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-sm">Add at least one skill to begin</p>';
    return;
  }
  container.innerHTML = userSkills.map(skill => `
    <span class="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 slide-up">
      <i class="fas fa-code"></i>
      <span>${skill}</span>
      <button onclick="removeSkill('${skill}')" class="hover:bg-green-600 rounded-full p-1 transition">
        <i class="fas fa-times"></i>
      </button>
    </span>
  `).join('');
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================
function analyzeJob() {
  const jobTitle = document.getElementById('jobTitle').value.trim();
  const jobDesc = document.getElementById('jobDesc').value.trim();

  if (!jobTitle || !jobDesc || userSkills.length === 0) {
    alert('⚠️ Please fill in all fields and add at least one skill');
    return;
  }

  const descLower = jobDesc.toLowerCase();
  const titleLower = jobTitle.toLowerCase();

  // 1. Skill Matching
  const matchedSkills = userSkills.filter(skill => descLower.includes(skill.toLowerCase()));

  // 2. Find required skills from job description
  const allKeywords = Object.values(TECH_KEYWORDS).flat();
  const requiredSkills = [];
  allKeywords.forEach(skill => {
    if (descLower.includes(skill) && !requiredSkills.includes(skill)) {
      requiredSkills.push(skill);
    }
  });

  // 3. Missing skills
  const missingSkills = requiredSkills.filter(
    skill => !matchedSkills.some(us => skill.includes(us) || us.includes(skill))
  );

  // 4. Match score
  const matchScore = requiredSkills.length > 0 
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  // 5. Tech breakdown by category
  const techBreakdown = {};
  Object.entries(TECH_KEYWORDS).forEach(([category, keywords]) => {
    techBreakdown[category] = keywords.filter(kw => descLower.includes(kw)).length;
  });

  // 6. Detect mismatches/red flags
  const warnings = [];
  
  if (/full[\s-]?stack/i.test(titleLower) && techBreakdown.backend > techBreakdown.frontend + 2) {
    warnings.push('⚠️ Title says "Full Stack" but job is mostly Backend-focused');
  }
  if (/fresher|entry[\s-]?level|junior/i.test(titleLower) && /\d+\s*(years?|yrs?)/i.test(jobDesc)) {
    warnings.push('⚠️ Title says "Fresher" but requires years of experience');
  }
  if (/frontend/i.test(titleLower) && techBreakdown.backend > 3) {
    warnings.push('⚠️ Title is "Frontend" but job requires significant Backend skills');
  }
  if (/backend/i.test(titleLower) && techBreakdown.frontend > 3) {
    warnings.push('⚠️ Title is "Backend" but job requires significant Frontend skills');
  }

  // 7. Generate recommendation
  let recommendation = 'Skip';
  let reason = '❌ Low match with your skills. Consider upskilling first.';

  if (matchScore >= 75 && warnings.length === 0) {
    recommendation = 'Apply';
    reason = '✅ Excellent match! You have most required skills.';
  } else if (matchScore >= 60 && warnings.length <= 1) {
    recommendation = 'Apply with Preparation';
    reason = '⚡ Good match, but you may need to learn a few skills.';
  } else if (matchScore >= 40) {
    recommendation = 'Consider';
    reason = '📚 Moderate match. You have foundational skills but gaps exist.';
  }

  // 8. Generate learning suggestions
  const suggestions = missingSkills.slice(0, 5).map(skill => ({
    skill,
    suggestion: generateSuggestion(skill),
  }));

  // Create analysis object
  const analysis = {
    jobTitle,
    matchScore,
    matchedSkills,
    missingSkills,
    warnings,
    recommendation,
    reason,
    techBreakdown,
    suggestions,
    timestamp: new Date().toLocaleString(),
  };

  // Save to history
  analysisHistory.unshift(analysis);
  analysisHistory = analysisHistory.slice(0, 20); // Keep last 20
  localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));

  // Display results
  currentViewedIdx = null; // Reset view
  displayResults(analysis);
  renderHistory();

  // Clear form
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobDesc').value = '';

  // Hide view indicator
  document.getElementById('viewIndicator').classList.add('hidden');
}

// ============================================
// GENERATE LEARNING SUGGESTIONS
// ============================================
function generateSuggestion(skill) {
  const suggestions = {
    'react': '📘 Take a React course on Udemy, FreeCodeCamp, or Scrimba',
    'python': '🐍 Learn Python through LeetCode, HackerRank, or DataCamp',
    'docker': '🐳 Complete Docker official tutorial and practice containerization',
    'kubernetes': '☸️ Study K8s documentation and run local minikube clusters',
    'typescript': '📘 Practice TypeScript on TS Playground and build projects',
    'aws': '☁️ Explore AWS free tier and build small projects',
    'sql': '💾 Practice SQL on LeetCode Database problems',
    'nodejs': '🚀 Build backend projects with Express and Node',
    'java': '☕ Learn Java through Codecademy or Oracle tutorials',
    'mongodb': '🍃 Practice MongoDB with cloud.mongodb.com free tier',
    'jenkins': '🔄 Set up CI/CD pipelines with Jenkins tutorials',
    'angular': '🔴 Explore Angular official docs and build components',
    'vue': '💚 Learn Vue.js through Vue mastery or official docs',
    'git': '🔧 Master Git through interactive tutorials and GitHub flow',
  };

  return suggestions[skill] || `📚 Learn ${skill} through online tutorials and practice projects`;
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(analysis) {
  const resultsSection = document.getElementById('resultsSection');
  
  // Build tech breakdown HTML
  let techHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
  Object.entries(analysis.techBreakdown).forEach(([cat, count]) => {
    const colors = {
      'backend': 'bg-blue-100 text-blue-800',
      'frontend': 'bg-pink-100 text-pink-800',
      'database': 'bg-orange-100 text-orange-800',
      'devops': 'bg-green-100 text-green-800',
      'cloud': 'bg-purple-100 text-purple-800',
      'testing': 'bg-cyan-100 text-cyan-800',
    };
    techHTML += `
      <div class="${colors[cat]} p-4 rounded-lg text-center border-2 border-gray-300">
        <p class="text-sm font-semibold">${cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
        <p class="text-3xl font-bold">${count}</p>
        <p class="text-xs">skills found</p>
      </div>
    `;
  });
  techHTML += '</div>';

  const getColor = (score) => {
    if (score >= 75) return 'from-green-400 to-green-600';
    if (score >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getRecommendationColor = (rec) => {
    if (rec === 'Apply') return 'bg-green-50 border-green-500 text-green-700';
    if (rec === 'Apply with Preparation') return 'bg-yellow-50 border-yellow-500 text-yellow-700';
    if (rec === 'Consider') return 'bg-blue-50 border-blue-500 text-blue-700';
    return 'bg-red-50 border-red-500 text-red-700';
  };

  const getRecommendationIcon = (rec) => {
    if (rec === 'Apply') return '<i class="fas fa-check-circle text-4xl text-green-600"></i>';
    if (rec === 'Apply with Preparation') return '<i class="fas fa-lightbulb text-4xl text-yellow-600"></i>';
    if (rec === 'Consider') return '<i class="fas fa-hourglass-half text-4xl text-blue-600"></i>';
    return '<i class="fas fa-times-circle text-4xl text-red-600"></i>';
  };

  resultsSection.innerHTML = `
    <!-- Job Title Header -->
    <div class="bg-white p-6 rounded-lg border-l-4 border-blue-600 slide-up">
      <h2 class="text-3xl font-bold text-gray-800">
        <i class="fas fa-briefcase text-blue-600"></i> ${analysis.jobTitle}
      </h2>
      <p class="text-gray-600 mt-2">
        <i class="fas fa-clock"></i> Analyzed on <span class="font-semibold">${analysis.timestamp}</span>
      </p>
    </div>

    <!-- Match Progress -->
    <div class="bg-white p-6 rounded-lg border-2 border-gray-200 slide-up">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Match Score</h2>
          <p class="text-sm text-gray-600">${analysis.matchScore >= 75 ? '✅ Excellent' : analysis.matchScore >= 50 ? '⚡ Good' : '📚 Needs Work'}</p>
        </div>
      </div>
      <div class="relative w-full h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
        <div class="h-full bg-gradient-to-r ${getColor(analysis.matchScore)} flex items-center justify-center transition-all duration-1000" style="width: ${analysis.matchScore}%">
          ${analysis.matchScore > 10 ? `<span class="text-white font-bold text-2xl">${analysis.matchScore}%</span>` : ''}
        </div>
        ${analysis.matchScore <= 10 ? `<span class="absolute inset-0 flex items-center justify-center text-gray-700 font-bold text-2xl">${analysis.matchScore}%</span>` : ''}
      </div>
      <p class="text-sm text-gray-600 mt-4">
        <strong>${analysis.matchedSkills.length}</strong> of <strong>${analysis.matchedSkills.length + analysis.missingSkills.length}</strong> required skills matched
      </p>
    </div>

    <!-- Skills Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up">
      <!-- Matched Skills -->
      <div class="bg-white p-6 rounded-lg border-2 border-green-300">
        <h3 class="text-xl font-bold text-green-700 mb-4">
          <i class="fas fa-check-circle"></i> Matched Skills (${analysis.matchedSkills.length})
        </h3>
        <div class="flex flex-wrap gap-2">
          ${analysis.matchedSkills.length > 0 
            ? analysis.matchedSkills.map(s => `
              <span class="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-green-200 transition cursor-pointer border-2 border-green-300">
                <i class="fas fa-check"></i> ${s}
              </span>
            `).join('')
            : '<p class="text-gray-500">No matched skills</p>'
          }
        </div>
      </div>

      <!-- Missing Skills -->
      <div class="bg-white p-6 rounded-lg border-2 border-red-300">
        <h3 class="text-xl font-bold text-red-700 mb-4">
          <i class="fas fa-times-circle"></i> Missing Skills (${analysis.missingSkills.length})
        </h3>
        <div class="flex flex-wrap gap-2">
          ${analysis.missingSkills.length > 0 
            ? analysis.missingSkills.map(s => `
              <span class="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-red-200 transition cursor-pointer border-2 border-red-300">
                <i class="fas fa-plus"></i> ${s}
              </span>
            `).join('')
            : '<p class="text-gray-500 font-semibold">✅ All required skills matched!</p>'
          }
        </div>
      </div>
    </div>

    <!-- Warnings/Red Flags -->
    ${analysis.warnings.length > 0 ? `
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg slide-up">
      <h3 class="text-xl font-bold text-yellow-800 mb-3">
        <i class="fas fa-exclamation-triangle"></i> Job Post Issues (${analysis.warnings.length})
      </h3>
      <ul class="space-y-2">
        ${analysis.warnings.map(w => `
          <li class="text-yellow-700 flex items-start gap-3">
            <i class="fas fa-flag text-yellow-600 mt-1"></i>
            <span>${w}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : `
    <div class="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg slide-up">
      <p class="text-green-700 font-semibold">
        <i class="fas fa-shield-alt"></i> No red flags detected! This job post looks legitimate.
      </p>
    </div>
    `}

    <!-- Recommendation Card -->
    <div class="bg-white ${getRecommendationColor(analysis.recommendation)} border-2 p-8 rounded-lg text-center slide-up">
      <div class="flex justify-center mb-4">${getRecommendationIcon(analysis.recommendation)}</div>
      <h2 class="text-3xl font-bold mb-2">${analysis.recommendation}</h2>
      <p class="text-lg mb-6">${analysis.reason}</p>
      <button onclick="alert('Redirecting to job application page...')" class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
        ${analysis.recommendation === 'Apply' ? '✅ Apply Now' : analysis.recommendation === 'Skip' ? '⏭️ Find Similar Jobs' : '📖 Learn Missing Skills'}
      </button>
    </div>

    <!-- Tech Stack Breakdown -->
    <div class="bg-white p-6 rounded-lg border-2 border-gray-200 slide-up">
      <h3 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-chart-bar text-blue-600"></i> Tech Stack Breakdown
      </h3>
      ${techHTML}
    </div>

    <!-- Learning Path -->
    ${analysis.suggestions.length > 0 ? `
    <div class="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg slide-up">
      <h3 class="text-2xl font-bold text-blue-700 mb-6">
        <i class="fas fa-book-open"></i> Learning Path for Missing Skills
      </h3>
      <div class="space-y-3">
        ${analysis.suggestions.map(s => `
          <div class="bg-white p-4 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition">
            <p class="font-semibold text-gray-800 mb-2">
              <i class="fas fa-code"></i> Learn: <span class="text-blue-600">${s.skill}</span>
            </p>
            <p class="text-gray-700 text-sm">${s.suggestion}</p>
          </div>
        `).join('')}
      </div>
      <p class="text-sm text-blue-700 mt-4 p-4 bg-white rounded border-l-4 border-blue-500">
        <i class="fas fa-lightbulb"></i> Focus on these skills to boost your profile and increase interview chances!
      </p>
    </div>
    ` : ''}
  `;

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// HISTORY MANAGEMENT - CLICKABLE PAST ANALYSES
// ============================================
function viewAnalysis(idx) {
  currentViewedIdx = idx;
  const analysis = analysisHistory[idx];
  
  // Show which analysis is being viewed
  document.getElementById('viewingTitle').textContent = analysis.jobTitle;
  document.getElementById('viewIndicator').classList.remove('hidden');
  
  displayResults(analysis);
  renderHistory(); // Re-render to show highlighting
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetView() {
  currentViewedIdx = null;
  document.getElementById('viewIndicator').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  renderHistory();
}

function clearAllHistory() {
  if (confirm('Are you sure? This will delete all analysis history.')) {
    analysisHistory = [];
    currentViewedIdx = null;
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    renderHistory();
    document.getElementById('resultsSection').classList.add('hidden');
  }
}

function renderHistory() {
  const panel = document.getElementById('historyPanel');
  
  if (analysisHistory.length === 0) {
    panel.innerHTML = '<p class="text-gray-500 text-center py-8">No analyses yet. Start analyzing!</p>';
    return;
  }

  panel.innerHTML = analysisHistory.map((item, idx) => `
    <div 
      class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 transition transform hover:scale-105 ${currentViewedIdx === idx ? 'active-history' : ''}" 
      onclick="viewAnalysis(${idx})"
    >
      <p class="font-semibold text-gray-700 truncate">
        <i class="fas fa-briefcase"></i> ${item.jobTitle}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        <i class="fas fa-clock"></i> ${item.timestamp}
      </p>
      <div class="mt-3 flex items-center gap-2">
        <div class="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-blue-600 to-blue-400" style="width: ${item.matchScore}%"></div>
        </div>
        <span class="text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded">${item.matchScore}%</span>
      </div>
      <div class="mt-2 flex gap-1">
        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          <i class="fas fa-check"></i> ${item.matchedSkills.length}
        </span>
        <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
          <i class="fas fa-plus"></i> ${item.missingSkills.length}
        </span>
      </div>
    </div>
  `).join('');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  // Allow Enter key for skill input
  const skillInput = document.getElementById('skillInput');
  if (skillInput) {
    skillInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
    });
  }

  // Load data from localStorage
  loadData();
});

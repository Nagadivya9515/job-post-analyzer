// Tech Keywords Database
const TECH_KEYWORDS = {
  backend: ['node', 'nodejs', 'express', 'java', 'python', 'django', 'flask', 'spring', 'api', 'server', 'backend', 'nestjs', 'fastapi'],
  frontend: ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'ui', 'ux', 'frontend', 'tailwind', 'bootstrap'],
  database: ['mysql', 'mongodb', 'sql', 'postgres', 'postgresql', 'cassandra', 'redis', 'elasticsearch'],
  devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'gitlab', 'github', 'terraform'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'lambda', 's3', 'ec2'],
  testing: ['jest', 'mocha', 'chai', 'testing', 'qa', 'cypress', 'selenium'],
};

// Global state
let userSkills = [];
let analysisHistory = [];

// Load from localStorage
function loadData() {
  userSkills = JSON.parse(localStorage.getItem('userSkills')) || [];
  analysisHistory = JSON.parse(localStorage.getItem('analysisHistory')) || [];
  renderSkills();
  renderHistory();
}

// Add skill
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

// Remove skill
function removeSkill(skill) {
  userSkills = userSkills.filter(s => s !== skill);
  localStorage.setItem('userSkills', JSON.stringify(userSkills));
  renderSkills();
}

// Render skills
function renderSkills() {
  const container = document.getElementById('skillsTags');
  container.innerHTML = userSkills.map(skill => `
    <span class="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
      <span>${skill}</span>
      <button onclick="removeSkill('${skill}')" class="hover:bg-green-600 rounded-full p-1">
        <i class="fas fa-times"></i>
      </button>
    </span>
  `).join('');
}

// Main analysis function
function analyzeJob() {
  const jobTitle = document.getElementById('jobTitle').value.trim();
  const jobDesc = document.getElementById('jobDesc').value.trim();

  if (!jobTitle || !jobDesc || userSkills.length === 0) {
    alert('Please fill in all fields and add at least one skill');
    return;
  }

  const descLower = jobDesc.toLowerCase();
  const titleLower = jobTitle.toLowerCase();

  // 1. Skill Matching
  const matchedSkills = userSkills.filter(skill => descLower.includes(skill.toLowerCase()));

  // 2. Find required skills
  const allKeywords = Object.values(TECH_KEYWORDS).flat();
  const requiredSkills = allKeywords.filter(skill => descLower.includes(skill));

  // 3. Missing skills
  const missingSkills = requiredSkills.filter(
    skill => !matchedSkills.some(us => skill.includes(us) || us.includes(skill))
  );

  // 4. Match score
  const matchScore = requiredSkills.length > 0 
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  // 5. Tech breakdown
  const techBreakdown = {};
  Object.entries(TECH_KEYWORDS).forEach(([category, keywords]) => {
    techBreakdown[category] = keywords.filter(kw => descLower.includes(kw)).length;
  });

  // 6. Detect mismatches
  const warnings = [];
  
  if (/full[\s-]?stack/i.test(titleLower) && techBreakdown.backend > techBreakdown.frontend + 2) {
    warnings.push('⚠️ Title says "Full Stack" but job is mostly Backend-focused');
  }
  if (/fresher|entry/i.test(titleLower) && /\d+\s*(years?|yrs?)/.test(jobDesc)) {
    warnings.push('⚠️ Title says "Fresher" but requires years of experience');
  }
  if (/frontend/i.test(titleLower) && techBreakdown.backend > 3) {
    warnings.push('⚠️ Title is "Frontend" but job requires significant Backend skills');
  }

  // 7. Recommendation
  let recommendation = 'Skip';
  let reason = 'Low match with your skills.';

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

  // 8. Suggestions
  const suggestions = missingSkills.slice(0, 5).map(skill => ({
    skill,
    suggestion: generateSuggestion(skill),
  }));

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
  analysisHistory = analysisHistory.slice(0, 10);
  localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));

  // Display results
  displayResults(analysis);
  renderHistory();
}

// Generate suggestions
function generateSuggestion(skill) {
  const suggestions = {
    'react': '📘 Take a React course on Udemy or FreeCodeCamp',
    'python': '🐍 Learn Python through LeetCode or HackerRank',
    'docker': '🐳 Complete Docker official tutorial',
    'kubernetes': '☸️ Study K8s documentation',
    'typescript': '📘 Practice TypeScript on TS Playground',
    'aws': '☁️ Explore AWS free tier',
    'sql': '💾 Practice SQL on LeetCode',
  };

  return suggestions[skill] || `📚 Learn ${skill} through online tutorials`;
}

// Display results
function displayResults(analysis) {
  const resultsSection = document.getElementById('resultsSection');
  
  // Build tech breakdown HTML
  let techHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
  Object.entries(analysis.techBreakdown).forEach(([cat, count]) => {
    if (count > 0) {
      techHTML += `
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <p class="text-sm text-gray-600">${cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
          <p class="text-2xl font-bold text-gray-800">${count}</p>
        </div>
      `;
    }
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
    return 'bg-red-50 border-red-500 text-red-700';
  };

  resultsSection.innerHTML = `
    <!-- Match Progress -->
    <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Match Score</h2>
          <p class="text-sm text-gray-600">${analysis.matchScore >= 75 ? 'Excellent' : analysis.matchScore >= 50 ? 'Good' : 'Needs Work'}</p>
        </div>
      </div>
      <div class="relative w-full h-12 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r ${getColor(analysis.matchScore)} flex items-center justify-center transition-all duration-1000" style="width: ${analysis.matchScore}%">
          <span class="text-white font-bold text-lg">${analysis.matchScore}%</span>
        </div>
      </div>
    </div>

    <!-- Skills -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg border-2 border-green-300">
        <h3 class="text-xl font-bold text-green-700 mb-4"><i class="fas fa-check"></i> Matched Skills</h3>
        <div class="flex flex-wrap gap-2">
          ${analysis.matchedSkills.length > 0 
            ? analysis.matchedSkills.map(s => `<span class="bg-green-100 text-green-700 px-3 py-2 rounded-full text-sm">✓ ${s}</span>`).join('')
            : '<p class="text-gray-500">No matched skills</p>'
          }
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border-2 border-red-300">
        <h3 class="text-xl font-bold text-red-700 mb-4"><i class="fas fa-times"></i> Missing Skills</h3>
        <div class="flex flex-wrap gap-2">
          ${analysis.missingSkills.length > 0 
            ? analysis.missingSkills.map(s => `<span class="bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm">✗ ${s}</span>`).join('')
            : '<p class="text-gray-500">All skills matched!</p>'
          }
        </div>
      </div>
    </div>

    <!-- Warnings -->
    ${analysis.warnings.length > 0 ? `
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
      <h3 class="text-xl font-bold text-yellow-800 mb-3"><i class="fas fa-exclamation-triangle"></i> Job Post Issues</h3>
      <ul class="space-y-2">
        ${analysis.warnings.map(w => `<li class="text-yellow-700">• ${w}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Recommendation -->
    <div class="bg-white border-2 ${getRecommendationColor(analysis.recommendation)} border-2 p-8 rounded-lg text-center">
      <h2 class="text-3xl font-bold mb-2">${analysis.recommendation}</h2>
      <p class="text-lg mb-6">${analysis.reason}</p>
      <button onclick="alert('Redirecting to job application...')" class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700">
        ${analysis.recommendation === 'Apply' ? 'Apply Now' : 'Learn More'}
      </button>
    </div>

    <!-- Tech Breakdown -->
    <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
      <h3 class="text-2xl font-bold text-gray-800 mb-6"><i class="fas fa-chart-bar"></i> Tech Stack Breakdown</h3>
      ${techHTML}
    </div>

    <!-- Learning Path -->
    ${analysis.suggestions.length > 0 ? `
    <div class="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
      <h3 class="text-2xl font-bold text-blue-700 mb-6"><i class="fas fa-book-open"></i> Learning Path</h3>
      <div class="space-y-3">
        ${analysis.suggestions.map(s => `
          <div class="bg-white p-4 rounded-lg border-l-4 border-blue-500">
            <p class="font-semibold text-gray-800 mb-2">Learn: <span class="text-blue-600">${s.skill}</span></p>
            <p class="text-gray-700 text-sm">${s.suggestion}</p>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Render history
function renderHistory() {
  const panel = document.getElementById('historyPanel');
  
  if (analysisHistory.length === 0) {
    panel.innerHTML = '<p class="text-gray-500 text-center py-8">No analyses yet</p>';
    return;
  }

  panel.innerHTML = analysisHistory.map((item, idx) => `
    <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100" onclick="scrollToTop()">
      <p class="font-semibold text-gray-700 truncate">${item.jobTitle}</p>
      <p class="text-sm text-gray-500">${item.timestamp}</p>
      <div class="mt-2 flex items-center gap-2">
        <div class="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600" style="width: ${item.matchScore}%"></div>
        </div>
        <span class="text-sm font-bold text-gray-700">${item.matchScore}%</span>
      </div>
    </div>
  `).join('');
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Allow Enter key for skill input
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('skillInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  });

  loadData();
});

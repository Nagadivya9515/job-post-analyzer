import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs";
// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';

// ============================================
// TECH SKILLS DATABASE
// ============================================
const TECH_KEYWORDS = {
  backend: ['node', 'nodejs', 'express', 'java', 'python', 'django', 'flask', 'spring', 'api', 'server', 'backend', 'nestjs', 'fastapi', 'golang', 'go', 'c#', 'csharp', 'dotnet', '.net', 'php', 'laravel', 'ruby', 'rails', 'rust', 'kotlin'],
  frontend: ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'ui', 'ux', 'frontend', 'tailwind', 'bootstrap', 'next.js', 'nextjs', 'svelte', 'jquery', 'webpack', 'babel'],
  database: ['mysql', 'mongodb', 'sql', 'postgres', 'postgresql', 'cassandra', 'redis', 'elasticsearch', 'firestore', 'dynamodb', 'oracle', 'mariadb', 'sqlite', 'neo4j'],
  devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'gitlab', 'github', 'terraform', 'ansible', 'puppet', 'vagrant', 'helm', 'prometheus', 'grafana'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'lambda', 's3', 'ec2', 'heroku', 'digitalocean', 'linode', 'firebase', 'cloudflare'],
  testing: ['jest', 'mocha', 'chai', 'testing', 'qa', 'cypress', 'selenium', 'junit', 'pytest', 'rspec', 'jasmine', 'vitest', 'karma'],
};

// ============================================
// GLOBAL STATE
// ============================================
let resumeText = null;           // Filled by file upload
let resumeFileName = null;
let pastedResumeText = null;     // Filled by textarea paste
let currentTab = 'upload';

// ============================================
// TAB SWITCHING
// ============================================
function switchResumeTab(tab) {
  currentTab = tab;
  
  const uploadSection = document.getElementById('uploadSection');
  const pasteSection = document.getElementById('pasteSection');
  const uploadTab = document.getElementById('uploadTab');
  const pasteTab = document.getElementById('pasteTab');

  if (tab === 'upload') {
    uploadSection.classList.remove('hidden');
    pasteSection.classList.add('hidden');
    uploadTab.classList.add('bg-purple-600', 'text-white');
    uploadTab.classList.remove('bg-gray-300', 'text-gray-700');
    pasteTab.classList.remove('bg-purple-600', 'text-white');
    pasteTab.classList.add('bg-gray-300', 'text-gray-700');
  } else {
    uploadSection.classList.add('hidden');
    pasteSection.classList.remove('hidden');
    pasteTab.classList.add('bg-purple-600', 'text-white');
    pasteTab.classList.remove('bg-gray-300', 'text-gray-700');
    uploadTab.classList.remove('bg-purple-600', 'text-white');
    uploadTab.classList.add('bg-gray-300', 'text-gray-700');
  }
}

// ============================================
// DRAG & DROP SUPPORT FOR UPLOAD
// ============================================
const dropZone = document.querySelector('label[for="resumeInput"]').parentElement;

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-purple-500', 'bg-purple-100');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-purple-500', 'bg-purple-100');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-purple-500', 'bg-purple-100');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById('resumeInput').files = files;
    handleResumeUpload();
  }
});

// ============================================
// RESUME UPLOAD HANDLER (PDF or TXT)
// ============================================
function handleResumeUpload() {
  const input = document.getElementById('resumeInput');
  const file = input.files[0];

  if (!file) {
    resetResumeStatus();
    return;
  }

  resumeFileName = file.name;
  const fileSize = (file.size / 1024).toFixed(2);
  const ext = file.name.split('.').pop().toLowerCase();

  const statusDiv = document.getElementById('resumeStatus');

  if (ext === 'txt') {
    // ===== TXT FILE HANDLER =====
    const reader = new FileReader();
    reader.onload = function(e) {
      resumeText = e.target.result;
      pastedResumeText = null; // Upload takes priority
      showSuccess(`${file.name} (${fileSize} KB)`);
    };
    reader.onerror = function() {
      showError('Failed to read TXT file. Please try again or paste text instead.');
    };
    reader.readAsText(file);
  } else if (ext === 'pdf') {
    // ===== PDF FILE HANDLER USING PDF.JS =====
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      
      pdfjsLib.getDocument({ data: typedarray }).promise.then(
        function(pdf) {
          let textPromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            textPromises.push(
              pdf.getPage(i).then(page => page.getTextContent())
            );
          }
          Promise.all(textPromises).then(pages => {
            resumeText = pages.flatMap(content =>
              content.items.map(item => item.str)
            ).join(' ');
            pastedResumeText = null; // Upload takes priority
            showSuccess(`${file.name} (${fileSize} KB, ${pdf.numPages} pages)`);
          });
        },
        function(error) {
          console.error('PDF Error:', error);
          showError('Could not read this PDF file. Please try another PDF file or paste your resume text instead.');
          input.value = '';
        }
      );
    };
    reader.readAsArrayBuffer(file);
  } else {
    showError('❌ Unsupported file format. Please upload PDF or TXT only.');
    input.value = '';
  }
}

// ============================================
// TEXTAREA PASTE HANDLER
// ============================================
document.getElementById('resumeTextarea').addEventListener('input', function(e) {
  pastedResumeText = e.target.value.trim();
  
  // Update paste status
  const pasteStatus = document.getElementById('pasteStatus');
  if (pastedResumeText.length > 0) {
    pasteStatus.innerHTML = `
      <i class="fas fa-check-circle text-green-600"></i> 
      <span class="text-green-700">${pastedResumeText.length} characters pasted</span>
    `;
  } else {
    pasteStatus.innerHTML = '<i class="fas fa-info-circle"></i> Paste your resume text here';
  }
});

// ============================================
// STATUS MESSAGES
// ============================================
function showSuccess(info) {
  document.getElementById('resumeStatus').innerHTML = `
    <div class="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
      <i class="fas fa-check-circle text-xl"></i>
      <div>
        <p class="font-semibold">Resume uploaded successfully!</p>
        <p class="text-sm">${info}</p>
      </div>
    </div>
  `;
}

function showError(message) {
  document.getElementById('resumeStatus').innerHTML = `
    <div class="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
      <i class="fas fa-exclamation-circle text-xl"></i>
      <div>
        <p class="font-semibold">${message}</p>
        <p class="text-xs mt-1">💡 Try switching to the "Paste Text" tab instead</p>
      </div>
    </div>
  `;
  resumeText = null;
}

function resetResumeStatus() {
  document.getElementById('resumeStatus').innerHTML = '';
  resumeText = null;
  resumeFileName = null;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================
function analyzeResume() {
  const jobDesc = document.getElementById('jobDesc').value.trim();

  // Use uploaded file first, then pasted text
  let localResumeText = resumeText || pastedResumeText || "";

  // Validation
  if (!localResumeText) {
    alert('⚠️ Please upload your resume OR paste your resume text!');
    return;
  }
  if (!jobDesc) {
    alert('⚠️ Please paste the job description!');
    return;
  }

  // Extract skills
  const descLower = jobDesc.toLowerCase();
  const resumeLower = localResumeText.toLowerCase();

  const allSkills = Object.values(TECH_KEYWORDS).flat();

  // Find required skills in job description
  const requiredSkills = [];
  allSkills.forEach(skill => {
    if (descLower.includes(skill) && !requiredSkills.includes(skill)) {
      requiredSkills.push(skill);
    }
  });

  // Find matched skills in resume
  const matchedSkills = requiredSkills.filter(skill =>
    resumeLower.includes(skill)
  );

  const missingSkills = requiredSkills.filter(skill =>
    !resumeLower.includes(skill)
  );

  // Calculate match score
  const matchScore = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  // Categorize skills by type
  const skillsByCategory = {};
  Object.entries(TECH_KEYWORDS).forEach(([category, keywords]) => {
    skillsByCategory[category] = {
      matched: keywords.filter(kw => matchedSkills.includes(kw)),
      missing: keywords.filter(kw => missingSkills.includes(kw)),
    };
  });

  // Display results
  displayResults({
    matchScore,
    matchedSkills,
    missingSkills,
    totalRequired: requiredSkills.length,
    totalMatched: matchedSkills.length,
    skillsByCategory,
  });
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(result) {
  const getColor = (score) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getLabel = (score) => {
    if (score >= 80) return '✅ Excellent Match';
    if (score >= 60) return '⚡ Good Match';
    if (score >= 40) return '📚 Moderate Match';
    return '❌ Low Match';
  };

  const getRecommendation = (score) => {
    if (score >= 80) return 'Your resume is a great fit for this job! Apply immediately.';
    if (score >= 60) return 'Your resume matches well. You should consider applying!';
    if (score >= 40) return 'You have some relevant skills. Consider updating your resume with the missing skills.';
    return 'This role requires skills you may not have. Consider upskilling first.';
  };

  // Build category breakdown
  let categoryHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">';
  Object.entries(result.skillsByCategory).forEach(([cat, skills]) => {
    const total = skills.matched.length + skills.missing.length;
    if (total > 0) {
      const colors = {
        'backend': 'bg-blue-100 text-blue-800 border-blue-300',
        'frontend': 'bg-pink-100 text-pink-800 border-pink-300',
        'database': 'bg-orange-100 text-orange-800 border-orange-300',
        'devops': 'bg-green-100 text-green-800 border-green-300',
        'cloud': 'bg-purple-100 text-purple-800 border-purple-300',
        'testing': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      };
      categoryHTML += `
        <div class="${colors[cat]} p-4 rounded-lg border-2">
          <p class="text-sm font-semibold">${cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
          <p class="text-3xl font-bold">${skills.matched.length}/${total}</p>
          <p class="text-xs mt-1">${skills.matched.length} matched</p>
        </div>
      `;
    }
  });
  categoryHTML += '</div>';

  document.getElementById('resultsSection').innerHTML = `
    <div class="space-y-6 fade-in">
      
      <!-- Main Match Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-3xl font-bold text-gray-800">Resume Match Score</h3>
            <p class="text-gray-600">${getLabel(result.matchScore)}</p>
          </div>
          <div class="text-right">
            <div class="text-5xl font-bold text-purple-600">${result.matchScore}%</div>
            <p class="text-sm text-gray-600">${result.totalMatched}/${result.totalRequired} skills</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="relative w-full h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300 mb-6">
          <div 
            class="h-full bg-gradient-to-r ${getColor(result.matchScore)} progress-animate flex items-center justify-center"
            style="width: 0%; transition: width 1s ease-out;"
            id="progressBar"
          >
            <span class="text-white font-bold text-lg" style="display: ${result.matchScore > 15 ? 'block' : 'none'};">${result.matchScore}%</span>
          </div>
          ${result.matchScore <= 15 ? `<span class="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg">${result.matchScore}%</span>` : ''}
        </div>

        <!-- Recommendation -->
        <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
          <p class="text-gray-800">
            <i class="fas fa-lightbulb text-yellow-500"></i>
            <strong> Recommendation:</strong> ${getRecommendation(result.matchScore)}
          </p>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-chart-pie text-purple-600"></i> Skills by Category
        </h3>
        ${categoryHTML}
      </div>

      <!-- Matched Skills -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-green-700 mb-6">
          <i class="fas fa-check-circle"></i> Skills Found in Your Resume (${result.matchedSkills.length})
        </h3>
        <div class="flex flex-wrap gap-3">
          ${result.matchedSkills.length > 0 ? result.matchedSkills.map(skill => `
            <span class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium border-2 border-green-300 hover:bg-green-200 transition">
              <i class="fas fa-check"></i> ${skill}
            </span>
          `).join('') : '<p class="text-gray-500">No matched skills</p>'}
        </div>
      </div>

      <!-- Missing Skills -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-red-700 mb-6">
          <i class="fas fa-times-circle"></i> Skills Missing from Your Resume (${result.missingSkills.length})
        </h3>
        <div class="flex flex-wrap gap-3">
          ${result.missingSkills.length > 0 ? result.missingSkills.map(skill => `
            <span class="bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium border-2 border-red-300 hover:bg-red-200 transition">
              <i class="fas fa-plus"></i> ${skill}
            </span>
          `).join('') : '<p class="text-green-600 font-bold"><i class="fas fa-star"></i> Perfect! Your resume contains all required skills!</p>'}
        </div>
      </div>

      <!-- Action Card -->
      <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
        <h3 class="text-2xl font-bold mb-4"><i class="fas fa-rocket"></i> Next Steps</h3>
        <ul class="space-y-3 text-lg">
          <li><i class="fas fa-check"></i> <strong>Update Your Resume:</strong> Add missing skills if you have experience</li>
          <li><i class="fas fa-check"></i> <strong>Highlight Matches:</strong> Emphasize the matched skills prominently</li>
          <li><i class="fas fa-check"></i> <strong>Apply Now:</strong> With these insights, you're ready!</li>
          <li><i class="fas fa-check"></i> <strong>Upskill:</strong> If match is low, consider learning the missing technologies</li>
        </ul>
      </div>
    </div>
  `;

  const resultsSection = document.getElementById('resultsSection');
  resultsSection.classList.remove('hidden');
  
  // Animate progress bar
  setTimeout(() => {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = `${result.matchScore}%`;
    }
  }, 100);

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

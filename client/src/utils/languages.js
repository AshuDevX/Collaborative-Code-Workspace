export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: '.js', monaco: 'javascript', icon: '🟨' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts', monaco: 'typescript', icon: '🔷' },
  { id: 'python', label: 'Python', ext: '.py', monaco: 'python', icon: '🐍' },
  { id: 'java', label: 'Java', ext: '.java', monaco: 'java', icon: '☕' },
  { id: 'c', label: 'C', ext: '.c', monaco: 'c', icon: '⚙️' },
  { id: 'cpp', label: 'C++', ext: '.cpp', monaco: 'cpp', icon: '⚙️' },
  { id: 'go', label: 'Go', ext: '.go', monaco: 'go', icon: '🐹' },
  { id: 'rust', label: 'Rust', ext: '.rs', monaco: 'rust', icon: '🦀' },
  { id: 'ruby', label: 'Ruby', ext: '.rb', monaco: 'ruby', icon: '💎' },
  { id: 'php', label: 'PHP', ext: '.php', monaco: 'php', icon: '🐘' },
  { id: 'kotlin', label: 'Kotlin', ext: '.kt', monaco: 'kotlin', icon: '🎯' },
  { id: 'swift', label: 'Swift', ext: '.swift', monaco: 'swift', icon: '🍎' },
  { id: 'html', label: 'HTML', ext: '.html', monaco: 'html', icon: '🌐' },
  { id: 'css', label: 'CSS', ext: '.css', monaco: 'css', icon: '🎨' },
  { id: 'json', label: 'JSON', ext: '.json', monaco: 'json', icon: '📋' },
  { id: 'markdown', label: 'Markdown', ext: '.md', monaco: 'markdown', icon: '📝' },
]

export const getLanguageByExt = (filename) => {
  const ext = '.' + filename.split('.').pop()
  return LANGUAGES.find(l => l.ext === ext) || LANGUAGES[0]
}

export const getLanguageById = (id) => LANGUAGES.find(l => l.id === id) || LANGUAGES[0]

export const DEFAULT_CODE = {
  javascript: `// Welcome to CodeCollab! 🚀
// Start coding together in real-time

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const results = [];
for (let i = 0; i < 10; i++) {
  results.push(fibonacci(i));
}

console.log('Fibonacci sequence:', results.join(', '));
`,
  python: `# Welcome to CodeCollab! 🚀

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

results = [fibonacci(i) for i in range(10)]
print('Fibonacci sequence:', ', '.join(map(str, results)))
`,
  typescript: `// Welcome to CodeCollab! 🚀

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const results: number[] = [];
for (let i = 0; i < 10; i++) {
  results.push(fibonacci(i));
}

console.log('Fibonacci sequence:', results.join(', '));
`,
  java: `// Welcome to CodeCollab! 🚀

public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("Fibonacci: ");
        for (int i = 0; i < 10; i++) {
            if (i > 0) sb.append(", ");
            sb.append(fibonacci(i));
        }
        System.out.println(sb.toString());
    }
}
`,
}

export const getDefaultCode = (langId) => DEFAULT_CODE[langId] || `// Start coding in ${langId}!\n`

export const USER_COLORS = [
  '#7c3aed', '#06b6d4', '#10b981', '#f97316',
  '#ec4899', '#eab308', '#ef4444', '#8b5cf6',
]

export const getUserColor = (index) => USER_COLORS[index % USER_COLORS.length]

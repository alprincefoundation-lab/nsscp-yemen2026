/**
 * NSSCP — Automated Security Regression Scan
 *
 * Scans the entire codebase for common security vulnerabilities.
 * Run: npx ts-node scripts/security-regression-scan.ts
 *
 * Checks:
 *   1. No unsafe SQL ($queryRawUnsafe, string concatenation in SQL)
 *   2. No hardcoded secrets/JWT keys
 *   3. No trusted x-* headers (impersonation vectors)
 *   4. All API routes have auth (requireAuth or getAuthenticatedUser)
 *   5. No eval(), Function() constructor
 *   6. No sensitive data leaked in responses
 *   7. Upload paths use path.join/normalize (traversal protection)
 *   8. No fs.writeFileSync() overwriting production API files
 *   9. No passwordHash or password in SELECT/response payloads
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Configuration ────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const SCAN_DIRS = ['app/api', 'lib', 'components'];
const SKIP_PATTERNS = ['node_modules', '.next', 'public', '.git', 'prisma/migrations'];

interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file: string;
  line: number;
  message: string;
}

const findings: Finding[] = [];

// ─── File scanner ─────────────────────────────────────────────────────────

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (SKIP_PATTERNS.some((skip) => fullPath.includes(skip))) continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath: string): void {
  const relativePath = filePath.replace(PROJECT_ROOT + '\\', '').replace(PROJECT_ROOT + '/', '').replace(/\\/g, '/');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Unsafe SQL
    if (line.includes('$queryRawUnsafe')) {
      findings.push({
        severity: 'CRITICAL',
        file: relativePath,
        line: lineNum,
        message: 'Unsafe SQL detected: $queryRawUnsafe — replace with Prisma ORM or parameterized queries',
      });
    }

    // 2. SQL string concatenation with variables
    if (/`\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s.*\${\s*\w+\s*}/i.test(line)) {
      findings.push({
        severity: 'HIGH',
        file: relativePath,
        line: lineNum,
        message: 'Potential SQL injection: template literal with variable in SQL statement',
      });
    }

    // 3. Hardcoded secrets
    if (/(?:SECRET|PASSWORD|API_KEY|TOKEN)\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/.test(line)) {
      findings.push({
        severity: 'HIGH',
        file: relativePath,
        line: lineNum,
        message: 'Potential hardcoded secret detected — use environment variables',
      });
    }

    // 4. Trusted x-* headers
    if (line.includes("x-user-id") || line.includes("x-hierarchy-entity-id") || line.includes("x-department-id")) {
      findings.push({
        severity: 'HIGH',
        file: relativePath,
        line: lineNum,
        message: 'Potentially trusted x-* header — verify it is not used for auth/authorization',
      });
    }

    // 5. eval / Function constructor
    if (/\beval\s*\(/.test(line) || /\bnew Function\s*\(/.test(line)) {
      findings.push({
        severity: 'CRITICAL',
        file: relativePath,
        line: lineNum,
        message: 'eval() or new Function() detected — severe security risk',
      });
    }

    // 6. passwordHash in response or select
    if (line.includes('passwordHash') && (line.includes('select') || line.includes('response') || line.includes('json') || line.includes('return'))) {
      findings.push({
        severity: 'CRITICAL',
        file: relativePath,
        line: lineNum,
        message: 'passwordHash may be leaked in response — verify it is excluded from output',
      });
    }

    // 7. fs.writeFileSync overwriting production files
    if (line.includes('writeFileSync') && (relativePath.includes('api/') || line.includes('route'))) {
      findings.push({
        severity: 'HIGH',
        file: relativePath,
        line: lineNum,
        message: 'writeFileSync detected in API code — may overwrite production routes',
      });
    }

    // 8. Direct path construction without path.join/normalize
    if ((line.includes('__dirname') || line.includes('cwd()') || line.includes('uploads')) &&
        line.includes("'") && line.includes("' + ") &&
        !line.includes('path.join') && !line.includes('path.resolve') && !line.includes('path.normalize')) {
      findings.push({
        severity: 'MEDIUM',
        file: relativePath,
        line: lineNum,
        message: 'File path constructed without path.join/normalize — potential traversal vector',
      });
    }
  });
}

// ─── API route auth audit ─────────────────────────────────────────────────

function auditApiRoutes(): void {
  const apiDir = join(PROJECT_ROOT, 'app', 'api');
  if (!existsSync(apiDir)) return;

  const routeFiles = walkDir(apiDir).filter((f) => f.endsWith('route.ts') || f.endsWith('route.tsx'));

  const PUBLIC_ROUTES = [
    'login', 'logout', 'health', 'refresh',
  ];

  for (const filePath of routeFiles) {
    const relativePath = filePath.replace(PROJECT_ROOT + '\\', '').replace(PROJECT_ROOT + '/', '').replace(/\\/g, '/');
    const content = readFileSync(filePath, 'utf-8');

    // Skip routes that don't export handlers
    const hasExports = /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b/i.test(content);
    if (!hasExports) continue;

    // Check if it's a known public route
    const isPublic = PUBLIC_ROUTES.some((r) => filePath.includes(`/auth/${r}`) || filePath.includes(`/${r}/`));

    if (isPublic) continue;

    // Check for auth
    const hasAuth = content.includes('requireAuth') || content.includes('getAuthenticatedUser');

    if (!hasAuth) {
      findings.push({
        severity: 'HIGH',
        file: relativePath,
        line: 1,
        message: 'API route missing authentication — add requireAuth() or getAuthenticatedUser()',
      });
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  console.log('🔒 NSSCP Security Regression Scan\n');
  console.log(`Project root: ${PROJECT_ROOT}\n`);

  // Scan all source files
  for (const dir of SCAN_DIRS) {
    const fullPath = join(PROJECT_ROOT, dir);
    const files = walkDir(fullPath);
    for (const file of files) {
      scanFile(file);
    }
  }

  // API route audit
  auditApiRoutes();

  // ─── Report ────────────────────────────────────────────────────────────

  const bySeverity: Record<string, Finding[]> = {};
  for (const f of findings) {
    if (!bySeverity[f.severity]) bySeverity[f.severity] = [];
    bySeverity[f.severity].push(f);
  }

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  for (const severity of severityOrder) {
    const items = bySeverity[severity] || [];
    if (items.length === 0) continue;

    console.log(`\n## ${severity} (${items.length})`);
    console.log('-'.repeat(60));
    for (const item of items) {
      console.log(`  ${item.file}:${item.line}  —  ${item.message}`);
    }
  }

  const critical = bySeverity.CRITICAL?.length || 0;
  const high = bySeverity.HIGH?.length || 0;
  const medium = bySeverity.MEDIUM?.length || 0;
  const total = findings.length;

  console.log('\n' + '='.repeat(60));
  console.log(`SCAN COMPLETE: ${total} findings`);
  console.log(`  CRITICAL: ${critical}`);
  console.log(`  HIGH:     ${high}`);
  console.log(`  MEDIUM:   ${medium}`);

  // Exit codes
  if (critical > 0) {
    console.log('\n❌ CRITICAL findings detected — release blocked');
    process.exit(1);
  }

  if (high > 0) {
    console.log('\n⚠️  HIGH severity findings — review required before release');
    process.exit(0);
  }

  console.log('\n✅ All security checks passed!');
  process.exit(0);
}

main();
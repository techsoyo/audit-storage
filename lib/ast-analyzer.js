// lib/ast-analyzer.js
import { parse } from 'acorn';
import { simple } from 'acorn-walk';

export function findLocalStorageUsage(code) {
  const issues = [];
  try {
    const ast = parse(code, { ecmaVersion: 2022, sourceType: 'module' });

    simple(ast, {
      MemberExpression(node) {
        if (
          node.object.name === 'localStorage' ||
          (node.object.type === 'Identifier' && node.object.name === 'storage')
        ) {
          issues.push({
            type: 'localStorage-access',
            line: node.loc?.start.line,
            code: node.object.name
          });
        }
      }
    });
  } catch (err) {
    console.warn('Error parsing code:', err.message);
  }
  return issues;
}
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod/v4'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for MCP server.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

const server = new McpServer({
  name: 'verdkomunumo-admin',
  version: '0.1.0'
})

const suggestionStatusSchema = z.enum(['pending', 'planned', 'closed'])
const reportStatusSchema = z.enum(['pending', 'resolved', 'dismissed'])

function asText(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  }
}

server.registerTool(
  'admin_snapshot',
  {
    description: 'Return a compact admin snapshot with counts of users, pending suggestions, and pending content reports.'
  },
  async () => {
    const [profilesRes, suggestionsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('app_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    return asText({
      users: profilesRes.count ?? 0,
      pendingSuggestions: suggestionsRes.count ?? 0,
      pendingReports: reportsRes.count ?? 0
    })
  }
)

server.registerTool(
  'list_app_suggestions',
  {
    description: 'List app suggestions from users to help prioritize product improvements.',
    inputSchema: {
      status: suggestionStatusSchema.optional(),
      limit: z.number().int().min(1).max(100).default(20)
    }
  },
  async ({ status, limit }) => {
    let query = supabase
      .from('app_suggestions')
      .select('id, title, description, context, status, created_at, reviewed_at, author:profiles!user_id(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return asText(data ?? [])
  }
)

server.registerTool(
  'update_app_suggestion_status',
  {
    description: 'Update the status of an app suggestion after triage.',
    inputSchema: {
      suggestionId: z.string().uuid(),
      status: suggestionStatusSchema,
      reviewedBy: z.string().uuid().optional()
    }
  },
  async ({ suggestionId, status, reviewedBy }) => {
    const payload: Record<string, string | null> = {
      status,
      reviewed_at: new Date().toISOString()
    }

    if (reviewedBy) {
      payload.reviewed_by = reviewedBy
    }

    const { data, error } = await supabase
      .from('app_suggestions')
      .update(payload)
      .eq('id', suggestionId)
      .select('id, status, reviewed_at')
      .single()

    if (error) throw error

    return asText(data)
  }
)

server.registerTool(
  'list_content_reports',
  {
    description: 'List content reports submitted by users for posts or comments.',
    inputSchema: {
      status: reportStatusSchema.optional(),
      limit: z.number().int().min(1).max(100).default(20)
    }
  },
  async ({ status, limit }) => {
    let query = supabase
      .from('content_reports')
      .select(
        'id, reason, details, status, created_at, reviewed_at, resolution_note, post_id, comment_id, author:profiles!user_id(username, display_name), post:posts!post_id(id, content), comment:comments!comment_id(id, content)'
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return asText(data ?? [])
  }
)

server.registerTool(
  'update_content_report_status',
  {
    description: 'Resolve or dismiss a content report after moderation review.',
    inputSchema: {
      reportId: z.string().uuid(),
      status: reportStatusSchema,
      resolutionNote: z.string().max(500).optional(),
      reviewedBy: z.string().uuid().optional()
    }
  },
  async ({ reportId, status, resolutionNote, reviewedBy }) => {
    const payload: Record<string, string | null> = {
      status,
      reviewed_at: new Date().toISOString(),
      resolution_note: resolutionNote ?? ''
    }

    if (reviewedBy) {
      payload.reviewed_by = reviewedBy
    }

    const { data, error } = await supabase
      .from('content_reports')
      .update(payload)
      .eq('id', reportId)
      .select('id, status, reviewed_at, resolution_note')
      .single()

    if (error) throw error

    return asText(data)
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Verdkomunumo MCP admin server running on stdio')
}

main().catch((error) => {
  console.error('Verdkomunumo MCP admin server error:', error)
  process.exit(1)
})

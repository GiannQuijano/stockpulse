export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, ExternalLink } from 'lucide-react'

export default async function BrandsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <Topbar
        title="Brands"
        description="Manage your client brands and integrations"
        action={
          <Link href="/brands/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        {!brands || brands.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No brands yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first brand to start tracking inventory
              </p>
              <Link href="/brands/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Brand
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">{brand.name}</CardTitle>
                    <Badge variant="secondary">{brand.platform}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {brand.last_synced_at
                          ? `Last synced ${new Date(brand.last_synced_at).toLocaleDateString()}`
                          : 'Never synced'}
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

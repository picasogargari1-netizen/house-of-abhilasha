import { useState, useMemo, useEffect } from "react";
import { useAllOrders, useAllProfiles } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, ShoppingCart, TrendingUp, Users, Calendar, Truck, Save, Loader2 } from "lucide-react";
import { subDays, subMonths, subYears, isAfter } from "date-fns";

type DateFilter = "7days" | "15days" | "1month" | "3months" | "6months" | "1year" | "all";

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: "7days", label: "Last 7 Days" },
  { value: "15days", label: "Last 15 Days" },
  { value: "1month", label: "Last 1 Month" },
  { value: "3months", label: "Last 3 Months" },
  { value: "6months", label: "Last 6 Months" },
  { value: "1year", label: "Last 1 Year" },
  { value: "all", label: "All Time" },
];

const getFilterDate = (filter: DateFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case "7days":
      return subDays(now, 7);
    case "15days":
      return subDays(now, 15);
    case "1month":
      return subMonths(now, 1);
    case "3months":
      return subMonths(now, 3);
    case "6months":
      return subMonths(now, 6);
    case "1year":
      return subYears(now, 1);
    case "all":
    default:
      return null;
  }
};

const AdminAnalyticsTab = () => {
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const { toast } = useToast();

  const [deliveryThreshold, setDeliveryThreshold] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  const fetchDeliverySettings = async () => {
    setDeliveryLoading(true);
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["delivery_fee_threshold", "delivery_fee_amount"]);
      if (data) {
        const settings: Record<string, string> = {};
        data.forEach((row: any) => { settings[row.key] = row.value; });
        setDeliveryThreshold(settings.delivery_fee_threshold ?? "999");
        setDeliveryFee(settings.delivery_fee_amount ?? "99");
      }
    } catch {
      setDeliveryThreshold("999");
      setDeliveryFee("99");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const saveDeliverySettings = async () => {
    const threshold = Number(deliveryThreshold);
    const fee = Number(deliveryFee);
    if (isNaN(threshold) || isNaN(fee) || threshold < 0 || fee < 0) {
      toast({ title: "Invalid values", description: "Please enter valid amounts", variant: "destructive" });
      return;
    }
    setDeliverySaving(true);
    try {
      const { error: err1 } = await supabase
        .from("site_settings")
        .upsert({ key: "delivery_fee_threshold", value: String(threshold), updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("site_settings")
        .upsert({ key: "delivery_fee_amount", value: String(fee), updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (err2) throw err2;

      toast({ title: "Saved", description: "Delivery fee settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setDeliverySaving(false);
    }
  };

  const isLoading = ordersLoading || profilesLoading;

  // Filter orders based on date range
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    const filterDate = getFilterDate(dateFilter);
    const nonCancelledOrders = orders.filter(o => o.status !== "cancelled");
    
    if (!filterDate) {
      return nonCancelledOrders;
    }
    
    return nonCancelledOrders.filter(order => 
      isAfter(new Date(order.created_at), filterDate)
    );
  }, [orders, dateFilter]);

  // Calculate KPIs from filtered orders
  const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate revenue per customer from filtered orders
  const customerRevenue = useMemo(() => {
    const revenue: Record<string, { email: string; name: string; revenue: number; orders: number }> = {};
    
    filteredOrders.forEach(order => {
      const userId = order.user_id;
      const profile = profiles?.find(p => p.user_id === userId);
      
      if (!revenue[userId]) {
        revenue[userId] = {
          email: profile?.email || "Unknown",
          name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
          revenue: 0,
          orders: 0,
        };
      }
      
      revenue[userId].revenue += Number(order.total_amount);
      revenue[userId].orders += 1;
    });
    
    return Object.values(revenue).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, profiles]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delivery Fee Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Delivery Fee Settings</CardTitle>
          </div>
          <CardDescription>
            Configure the cart amount threshold for free delivery and the delivery fee for orders below that amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveryLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="space-y-2 w-full sm:w-auto">
                <Label htmlFor="delivery-threshold" data-testid="label-delivery-threshold">Cart Amount Below (&#8377;)</Label>
                <Input
                  id="delivery-threshold"
                  data-testid="input-delivery-threshold"
                  type="number"
                  min="0"
                  value={deliveryThreshold}
                  onChange={(e) => setDeliveryThreshold(e.target.value)}
                  placeholder="e.g. 900"
                  className="w-full sm:w-48"
                />
              </div>
              <div className="space-y-2 w-full sm:w-auto">
                <Label htmlFor="delivery-fee" data-testid="label-delivery-fee">Delivery Fee (&#8377;)</Label>
                <Input
                  id="delivery-fee"
                  data-testid="input-delivery-fee"
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full sm:w-48"
                />
              </div>
              <Button data-testid="button-save-delivery" onClick={saveDeliverySettings} disabled={deliverySaving}>
                {deliverySaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          )}
          {deliveryThreshold && deliveryFee && (
            <p className="text-sm text-muted-foreground mt-3" data-testid="text-delivery-summary">
              Orders below &#8377;{Number(deliveryThreshold).toLocaleString()} will have a &#8377;{Number(deliveryFee).toLocaleString()} delivery fee. Orders of &#8377;{Number(deliveryThreshold).toLocaleString()} or above get free delivery.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Date Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">₹{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{profiles?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Customer */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Customer</CardTitle>
          <CardDescription>
            Top customers sorted by total revenue
            {dateFilter !== "all" && ` (${dateFilterOptions.find(o => o.value === dateFilter)?.label})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Avg. Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerRevenue.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{customer.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₹{(customer.revenue / customer.orders).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No customer data available for this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsTab;
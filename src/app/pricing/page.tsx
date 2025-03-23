"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Check, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-6 px-4">
        {/* Desktop view */}
        <div className="hidden md:flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-antonio">
              <b>S<i>a</i>ve the D<i>a</i>te</b>
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/pricing" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>

        {/* Mobile view */}
        <div className="flex md:hidden justify-between items-center">
          <div className="w-10">
            {/* Empty div for spacing */}
          </div>
          
          {/* Centered logo */}
          <Link href="/" className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-antonio">
              <b>S<i>a</i>ve the D<i>a</i>te</b>
            </span>
          </Link>
          
          {/* Burger menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex justify-center items-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className={cn(
            "fixed top-0 right-0 h-full w-[250px] bg-background border-l p-6 shadow-lg transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-medium">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-4">
            <Link 
              href="/pricing" 
              className="block text-sm font-medium hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Button asChild className="w-full">
              <Link 
                href="/create-event"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </Button>
          </nav>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Pricing Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your event needs with no hidden fees or surprises.
            </p>
          </div>

          {/* Pricing Toggle - You can implement this later if you want to show monthly/annual */}
          
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Basic Plan */}
            <Card className="border-2 border-muted flex flex-col h-full">
              <CardHeader className="pb-8">
                <Badge variant="outline" className="w-fit mb-2">Basic</Badge>
                <CardTitle className="text-2xl">
                  $10
                  <span className="text-muted-foreground text-sm ml-1">/ event</span>
                </CardTitle>
                <CardDescription>
                  Perfect for small personal events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[280px] flex-grow">
                <div className="space-y-2 pb-[60px]">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Up to 50 guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Basic event page customization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Digital invitation links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>QR code for event</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Basic RSVP tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <X className="h-5 w-5 flex-shrink-0" />
                    <span>Custom image uploads</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <X className="h-5 w-5 flex-shrink-0" />
                    <span>Premium designs</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/create-event?plan=basic">Choose Basic</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-primary relative flex flex-col h-full">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most Popular
              </div>
              <CardHeader className="pb-8">
                <Badge variant="default" className="w-fit mb-2">Premium</Badge>
                <CardTitle className="text-2xl">
                  $30
                  <span className="text-muted-foreground text-sm ml-1">/ event</span>
                </CardTitle>
                <CardDescription>
                  Ideal for medium events and celebrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[280px] flex-grow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Up to 200 guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Full event page customization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Digital + email invitations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Custom QR code design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Advanced RSVP tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Custom image uploads (up to 10)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Premium designs</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/create-event?plan=premium">Choose Premium</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-muted flex flex-col h-full">
              <CardHeader className="pb-8">
                <Badge variant="secondary" className="w-fit mb-2">Enterprise</Badge>
                <CardTitle className="text-2xl">
                  $100
                  <span className="text-muted-foreground text-sm ml-1">/ event</span>
                </CardTitle>
                <CardDescription>
                  For large events and professional organizers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[280px] flex-grow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Unlimited guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Complete white label customization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Digital, email & SMS invitations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Premium QR code with analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Enterprise RSVP tracking & analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Unlimited image uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Priority support</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/create-event?plan=enterprise">Choose Enterprise</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Feature Comparison Section */}
          <div className="bg-muted/50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Compare All Features</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium">Basic</th>
                    <th className="text-center py-4 px-4 font-medium">Premium</th>
                    <th className="text-center py-4 px-4 font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Guest Limit</td>
                    <td className="text-center py-3 px-4">50</td>
                    <td className="text-center py-3 px-4">200</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Event Duration</td>
                    <td className="text-center py-3 px-4">30 days</td>
                    <td className="text-center py-3 px-4">90 days</td>
                    <td className="text-center py-3 px-4">1 year</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Custom Domain</td>
                    <td className="text-center py-3 px-4"><X className="h-5 w-5 mx-auto text-muted-foreground" /></td>
                    <td className="text-center py-3 px-4"><X className="h-5 w-5 mx-auto text-muted-foreground" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Guest Messaging</td>
                    <td className="text-center py-3 px-4">Email only</td>
                    <td className="text-center py-3 px-4">Email + App</td>
                    <td className="text-center py-3 px-4">Email + App + SMS</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Guest Surveys</td>
                    <td className="text-center py-3 px-4"><X className="h-5 w-5 mx-auto text-muted-foreground" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">API Access</td>
                    <td className="text-center py-3 px-4"><X className="h-5 w-5 mx-auto text-muted-foreground" /></td>
                    <td className="text-center py-3 px-4"><X className="h-5 w-5 mx-auto text-muted-foreground" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Data Export</td>
                    <td className="text-center py-3 px-4">CSV</td>
                    <td className="text-center py-3 px-4">CSV, Excel</td>
                    <td className="text-center py-3 px-4">CSV, Excel, API</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4">Email + Chat</td>
                    <td className="text-center py-3 px-4">Priority Support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Can I upgrade my plan later?</h3>
                <p className="text-muted-foreground">Yes, you can upgrade your plan at any time. The price difference will be prorated for the remaining duration of your event.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">What happens if I exceed my guest limit?</h3>
                <p className="text-muted-foreground">You'll be notified when you reach 80% of your guest limit. You can then choose to upgrade to a higher plan to accommodate more guests.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Do you offer refunds?</h3>
                <p className="text-muted-foreground">We offer a 7-day money-back guarantee if you're not satisfied with our service. After that period, subscriptions are non-refundable.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Is there a free trial available?</h3>
                <p className="text-muted-foreground">We don't offer a traditional free trial, but you can create a test event to explore our features before making a purchase.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center py-8 px-4 bg-primary rounded-xl text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to create your event?</h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
              Get started today and create memorable invitations for your special occasions.
            </p>
            <Button 
              asChild 
              size="lg" 
              variant="secondary" 
              className="rounded-full px-8"
            >
              <Link href="/create-event">Start Your Free Trial</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SaveTheDate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 
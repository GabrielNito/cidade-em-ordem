'use client'

import NextLink from 'next/link'
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation'
import type { ComponentProps, ReactNode } from 'react'

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href' | 'children' | 'className'> & {
  to: string
  children: ReactNode
  className?: string
}

export function Link({ to, children, ...props }: LinkProps) {
  return <NextLink href={to} {...props}>{children}</NextLink>
}

type NavLinkClassName = string | ((state: { isActive: boolean }) => string)

export function NavLink({
  to,
  end = false,
  className,
  children,
  ...props
}: Omit<LinkProps, 'className'> & { end?: boolean; className?: NavLinkClassName }) {
  const pathname = usePathname() ?? ''
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className
  return <NextLink href={to} className={resolvedClassName} aria-current={isActive ? 'page' : undefined} {...props}>{children}</NextLink>
}

export type NavigateOptions = { replace?: boolean }

export function useNavigate() {
  const router = useRouter()
  return (to: string | number, options: NavigateOptions = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back()
      else router.forward()
      return
    }
    if (options.replace) router.replace(to)
    else router.push(to)
  }
}

export function useParams<T extends Record<string, string | undefined>>() {
  return useNextParams() as T
}

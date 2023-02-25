/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * Copyright (c) 2023, v2rayA Organization <team@v2raya.org>
 */

const Marshaller = require('./marshaller.js')
const Encoder = require('./encoder.js')

const marshaller = new Marshaller(`{
  "version": "unknown",
  "leaves": [
    "bool",
    "config.FunctionListOrString",
    "config.FunctionOrString",
    "config.KeyableString",
    "config_parser.Function",
    "config_parser.RoutingRule",
    "string",
    "time.Duration",
    "uint16"
  ],
  "structure": [
    {
      "name": "Global",
      "mapping": "global",
      "type": "config.Global",
      "structure": [
        {
          "name": "TproxyPort",
          "mapping": "tproxy_port",
          "type": "uint16",
          "desc": "tproxy port to listen at. It is NOT a HTTP/SOCKS port, and is just used by eBPF program.\\nIn normal case, you do not need to use it."
        },
        {
          "name": "LogLevel",
          "mapping": "log_level",
          "type": "string",
          "desc": "Log level: error, warn, info, debug, trace."
        },
        {
          "name": "TcpCheckUrl",
          "mapping": "tcp_check_url",
          "type": "string",
          "desc": "Node connectivity check.\\nHost of URL should have both IPv4 and IPv6 if you have double stack in local.\\nConsidering traffic consumption, it is recommended to choose a site with anycast IP and less response."
        },
        {
          "name": "UdpCheckDns",
          "mapping": "udp_check_dns",
          "type": "string",
          "desc": "This DNS will be used to check UDP connectivity of nodes. And if dns_upstream below contains tcp, it also be used to check TCP DNS connectivity of nodes.\\nThis DNS should have both IPv4 and IPv6 if you have double stack in local."
        },
        {
          "name": "CheckInterval",
          "mapping": "check_interval",
          "type": "time.Duration",
          "desc": "Interval of connectivity check for TCP and UDP"
        },
        {
          "name": "CheckTolerance",
          "mapping": "check_tolerance",
          "type": "time.Duration",
          "desc": "Group will switch node only when new_latency \u003c= old_latency - tolerance."
        },
        {
          "name": "DnsUpstream",
          "mapping": "dns_upstream",
          "type": "string"
        },
        {
          "name": "LanInterface",
          "mapping": "lan_interface",
          "isArray": true,
          "type": "string",
          "desc": "The LAN interface to bind. Use it if you only want to proxy LAN instead of localhost."
        },
        {
          "name": "LanNatDirect",
          "mapping": "lan_nat_direct",
          "type": "bool",
          "desc": "SNAT for incoming connection to avoid MAC learning.\\nAlways set it true if you are NOT using dae as a transparent bridge, but will reduce forwarding performance for direct traffic in LAN mode.\\nThis option does not affect direct traffic performance of WAN.",
          "value": true
        },
        {
          "name": "WanInterface",
          "mapping": "wan_interface",
          "isArray": true,
          "type": "string",
          "desc": "The WAN interface to bind. Use it if you want to proxy localhost."
        },
        {
          "name": "AllowInsecure",
          "mapping": "allow_insecure",
          "type": "bool",
          "desc": "Allow insecure TLS certificates. It is not recommended to turn it on unless you have to."
        },
        {
          "name": "DialMode",
          "mapping": "dial_mode",
          "type": "string",
          "desc": "Optional values of dial_mode are:\\n1. \\"ip\\". Dial proxy using the IP from DNS directly. This allows your ipv4, ipv6 to choose the optimal path respectively, and makes the IP version requested by the application meet expectations. For example, if you use curl -4 ip.sb, you will request IPv4 via proxy and get a IPv4 echo. And curl -6 ip.sb will request IPv6. This may solve some wierd full-cone problem if your are be your node support that.\\n2. \\"domain\\". Dial proxy using the domain from sniffing. This will relieve DNS pollution problem to a great extent if have impure DNS environment. Generally, this mode brings faster proxy response time because proxy will re-resolve the domain in remote, thus get better IP result to connect. This policy does not impact routing. That is to say, domain rewrite will be after traffic split of routing and dae will not re-route it.\\n3. \\"domain+\\". Based on domain mode but do not check the authenticity of sniffing result. It is useful for users whose DNS requests do not go through dae but want faster proxy response time. Notice that, if DNS requests do not go through dae, dae cannot split traffic by domain."
        }
      ]
    },
    {
      "name": "Subscription",
      "mapping": "subscription",
      "isArray": true,
      "type": "config.KeyableString",
      "desc": "Subscriptions defined here will be resolved as nodes and merged as a part of the global node pool.\\nSupport to give the subscription a tag, and filter nodes from a given subscription in the group section.",
      "value": ["mysub:https://test.com/my_sub"]
    },
    {
      "name": "Node",
      "mapping": "node",
      "isArray": true,
      "type": "config.KeyableString",
      "desc": "Nodes defined here will be merged as a part of the global node pool.",
      "value": ["abc:http://hhhh.com", "http://test.com"]
    },
    {
      "name": "Group",
      "mapping": "group",
      "isArray": true,
      "type": "config.Group",
      "desc": "Node group. Groups defined here can be used as outbounds in section \\"routing\\".",
      "structure": [
        {
          "name": "Name",
          "mapping": "_",
          "type": "string",
          "value": ["my_group"]
        },
        {
          "name": "Filter",
          "mapping": "filter",
          "isArray": true,
          "type": "config_parser.Function",
          "desc": "Filter nodes from the global node pool defined by the \\"subscription\\" and \\"node\\" sections.\\nAvailable functions: name, subtag. Not operator is supported.\\nAvailable keys in name function: keyword, regex. No key indicates full match.\\nAvailable keys in subtag function: regex. No key indicates full match.",
          "value": [["!name(keyword: HK)", "subtag(mysub)"]]
        },
        {
          "name": "Policy",
          "mapping": "policy",
          "type": "config.FunctionListOrString",
          "desc": "Dialer selection policy. For each new connection, select a node as dialer from group by this policy.\\nAvailable values: random, fixed, min, min_avg10, min_moving_avg.\\nrandom: Select randomly.\\nfixed: Select the fixed node. Connectivity check will be disabled.\\nmin: Select node by the latency of last check.\\nmin_avg10: Select node by the average of latencies of last 10 checks.\\nmin_moving_avg: Select node by the moving average of latencies of checks, which means more recent latencies have higher weight.\\n",
          "value": ["${Encoder.FunctionListOrString([
    Encoder.Function('fixed', [Encoder.Param(null, 0)])
])}"]
        }
      ]
    },
    {
      "name": "Routing",
      "mapping": "routing",
      "type": "config.Routing",
      "desc": "Traffic follows this routing. See https://github.com/v2rayA/dae/blob/main/docs/routing.md for full examples.\\nNotice: domain traffic split will fail if DNS traffic is not taken over by dae.\\nBuilt-in outbound: direct, must_direct, block.\\nAvailable functions: domain, sip, dip, sport, dport, ipversion, l4proto, pname, mac.\\nAvailable keys in domain function: suffix, keyword, regex, full. No key indicates suffix.\\ndomain: Match domain.\\nsip: Match source IP. CIDR format is also supported.\\ndip: Match dest IP. CIDR format is also supported.\\nsport: Match source port. Range like 8000-9000 is also supported.\\ndport: Match dest port. Range like 8000-9000 is also supported.\\nipversion: Match IP version. Available values: 4, 6.\\nl4proto: Match level 4 protocol. Available values: tcp, udp.\\npname: Match process name. It only works on WAN mode and for localhost programs.\\nmac: Match source MAC address. It works on LAN mode.",
      "structure": [
        {
          "name": "Rules",
          "mapping": "_",
          "isArray": true,
          "type": "config_parser.RoutingRule",
          "value": ["domain(geosite:cn) -> direct"]
        },
        {
          "name": "Fallback",
          "mapping": "fallback",
          "type": "config.FunctionOrString",
          "value": "direct"
        }
      ]
    },
    {
      "name": "Dns",
      "mapping": "dns",
      "type": "config.Dns",
      "desc": "See more at https://github.com/v2rayA/dae/blob/main/docs/dns.md.",
      "structure": [
        {
          "name": "Upstream",
          "mapping": "upstream",
          "isArray": true,
          "type": "config.KeyableString",
          "desc": "Value can be scheme://host:port, where the scheme can be tcp/udp/tcp+udp.\\nIf host is a domain and has both IPv4 and IPv6 record, dae will automatically choose IPv4 or IPv6 to use according to group policy (such as min latency policy).\\nPlease make sure DNS traffic will go through and be forwarded by dae, which is REQUIRED for domain routing.\\nIf dial_mode is \\"ip\\", the upstream DNS answer SHOULD NOT be polluted, so domestic public DNS is not recommended.",
          "value": ["alidns: udp://alidns.com:53"]
        },
        {
          "name": "Routing",
          "mapping": "routing",
          "type": "config.DnsRouting",
          "structure": [
            {
              "name": "Request",
              "mapping": "request",
              "type": "config.DnsRequestRouting",
              "desc": "DNS requests will follow this routing.\\nBuilt-in outbound: asis.\\nAvailable functions: qname, qtype",
              "structure": [
                {
                  "name": "Rules",
                  "mapping": "_",
                  "isArray": true,
                  "type": "config_parser.RoutingRule",
                  "value": ["qname(geosite:cn)->alidns"]
                },
                {
                  "name": "Fallback",
                  "mapping": "fallback",
                  "type": "config.FunctionOrString",
                  "value": "asis"
                }
              ]
            },
            {
              "name": "Response",
              "mapping": "response",
              "type": "config.DnsResponseRouting",
              "desc": "DNS responses will follow this routing.\\nBuilt-in outbound: accept, reject.\\nAvailable functions: qname, qtype, ip, upstream",
              "structure": [
                {
                  "name": "Rules",
                  "mapping": "_",
                  "isArray": true,
                  "type": "config_parser.RoutingRule"
                },
                {
                  "name": "Fallback",
                  "mapping": "fallback",
                  "type": "config.FunctionOrString",
                  "value": "accept"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
`)

console.log(marshaller.marshal())

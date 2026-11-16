import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{n as t,r as n}from"./loader-circle-BcMcyfZI.js";import{t as r}from"./supabase-DrGXNeZ_.js";import{r as i}from"./supabaseCustomerOrders-DXMridKR.js";import{c as a}from"./settings-CxoF3nnp.js";var o={name:`check`,size:24,node:[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]};o.node;var s=t(o),c={name:`circle-x`,size:24,node:[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`path`,{d:`m15 9-6 6`,key:`1uzhvr`}],[`path`,{d:`m9 9 6 6`,key:`z0biqf`}]],aliases:[`x-circle`]};c.node;var l=t(c),u={name:`cooking-pot`,size:24,node:[[`path`,{d:`M2 12h20`,key:`9i4pu4`}],[`path`,{d:`M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8`,key:`u0tga0`}],[`path`,{d:`m4 8 16-4`,key:`16g0ng`}],[`path`,{d:`m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8`,key:`12cejc`}]]};u.node;var d=t(u),f={name:`file-check-corner`,size:24,node:[[`path`,{d:`M10.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v6`,key:`g5mvt7`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`,key:`wfsgrz`}],[`path`,{d:`m14 20 2 2 4-4`,key:`15kota`}]],aliases:[`file-check-2`]};f.node;var p=t(f),m={name:`search`,size:24,node:[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]};m.node;var h=t(m);async function g(e){let t=i();if(!t)throw Error(`Your secure order session has expired. Please recover your order first.`);let{error:n}=await r.rpc(`submit_customer_payment_proof`,{p_order_number:e.order.orderNumber,p_token:t,p_sender_name:e.senderName.trim(),p_notes:e.notes?.trim()||null});if(n)throw Error(n.message)}async function _(){let{data:e,error:t}=await r.from(`payment_submissions`).select(`
      id,
      order_id,
      sender_name,
      notes,
      status,
      created_at,
      reviewed_at,
      orders!payment_submissions_order_id_fkey (
        id,
        order_number,
        customer_name,
        total,
        order_items (
          product_name,
          unit_price,
          quantity,
          preparation
        )
      )
    `).order(`created_at`,{ascending:!1});if(t)throw t;return(e??[]).flatMap(e=>{let t=e.orders;return t?[{id:e.id,orderId:e.order_id,orderNumber:t.order_number,customerName:t.customer_name,total:Number(t.total),items:(t.order_items??[]).map(e=>({menuItemId:``,name:e.product_name,price:Number(e.unit_price),quantity:Number(e.quantity),...e.preparation?{preparation:e.preparation}:{}})),senderName:e.sender_name,notes:e.notes??``,status:e.status,createdAt:new Date(e.created_at).getTime(),...e.reviewed_at?{reviewedAt:new Date(e.reviewed_at).getTime()}:{}}]:[]})}function v(e){let t=!1,n=!1,r=async()=>{if(!(t||n)){n=!0;try{let n=await _();t||e(n)}catch(e){console.error(`Unable to load payment submissions:`,e)}finally{n=!1}}};r();let i=window.setInterval(()=>void r(),8e3);return()=>{t=!0,window.clearInterval(i)}}async function y(e,t){let{error:n}=await r.rpc(`review_manual_payment`,{p_submission_id:e.id,p_decision:t,p_reason:t===`approved`?`Bank transfer verified by authorised reviewer`:`Bank transfer could not be verified`});if(n)throw n}function b(e){return y(e,`approved`)}function x(e){return y(e,`rejected`)}var S=e(n(),1),C=[{label:`Zenith Bank`,accountName:`Nwaogu Darlington Chigaemezu`,bankName:`Zenith Bank`,accountNumber:`2266358479`},{label:`Opay`,accountName:`Nwaogu Darlington Chigaemezu`,bankName:`Opay`,accountNumber:`8146649547`}];function w(){let[e,t]=(0,S.useState)([]),[n,r]=(0,S.useState)(!0);return(0,S.useEffect)(()=>a(e=>{t(e),r(!1)}),[]),{enabledAccounts:(0,S.useMemo)(()=>{let t=C.filter(t=>!e.includes(t.label));return t.length>0?t:C},[e]),disabledLabels:e,loading:n}}export{g as a,p as c,s as d,x as i,d as l,C as n,v as o,b as r,h as s,w as t,l as u};
import { File, Function, Editor } from '@kubb/react'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'
import { useOperationFile } from '@kubb/swagger/hooks'

export const templates = {
  default: function({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
    const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

    const file = useOperationFile({ extName: '.py' })

    return (
      <>
        <Editor language="typescript">
          <File.Import name="axios" path="axios" />
          <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
            {`return axios.${client.method}(${clientParams}`}
          </Function>
        </Editor>
        <Editor language="kotlin">
          {`
package com.example.blog

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HtmlController {

  @GetMapping("${client.path.URL}")
  fun ${name}(model: Model): String {
    model["title"] = "Blog"
    return "blog"
  }
}
        `}
        </Editor>
        <Editor language="text">
          <File
            baseName={file.baseName}
            path={file.path}
            meta={file.meta}
          >
            <File.Source>
              ai ai ai
            </File.Source>
          </File>
        </Editor>
      </>
    )
  },
} as const
